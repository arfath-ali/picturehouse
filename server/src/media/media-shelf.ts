import type { IncomingMessage, ServerResponse } from 'node:http';
import shelf from '../data/media-shelf.json' with { type: 'json' };
import type { TMDBMediaShelf } from '../types/tmdb-content.js';
import fetchFromTMDB from '../api/tmdb-service.js';
import { redisClient } from '../cache/redis.js';
import type { MediaReferanceItems } from '../types/media-reference-items.js';
import { parseMediaShelf } from '../services/tmdb-parser.js';
import { inFlightIndexKeys, waitForFlightIn } from '../utils/in-flight.js';

export async function getMediaShelf(req: IncomingMessage, res: ServerResponse) {
  if (!req.params) return;

  const { page, mediaShelf } = req.params;

  if (!page || !mediaShelf) return;

  const isTrending =
    mediaShelf === 'trending-movies' || mediaShelf === 'trending-tv-shows';

  let contentReferenceItems: MediaReferanceItems[] = [];

  if (!isTrending) {
    contentReferenceItems = (shelf as any)[page][mediaShelf];

    if (!contentReferenceItems) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Category not found' }));
      return;
    }
  }

  const featuredIndexKey = `featured-${page}`;
  const featuredIndexData = await redisClient.get(featuredIndexKey);
  let featuredIds: string[] = [];

  if (featuredIndexData) {
    const { mediaEntries } = JSON.parse(featuredIndexData);
    featuredIds = (mediaEntries as string[]).map(
      (entry) => entry.split(':')[1],
    );
  }

  const mediaShelfIndexKey = `media-shelf-${page}-${mediaShelf}`;
  const cachedIndexData = await redisClient.get(mediaShelfIndexKey);

  if (cachedIndexData) {
    const { mediaEntries, timestamp } = JSON.parse(cachedIndexData);

    const isCacheExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;

    if (isCacheExpired && !inFlightIndexKeys.has(mediaShelfIndexKey)) {
      inFlightIndexKeys.add(mediaShelfIndexKey);
      (async () => {
        try {
          await fetchFreshMediaData(
            featuredIds,
            mediaShelfIndexKey,
            mediaEntries,
            mediaShelf,
            contentReferenceItems,
          );
        } catch (error) {
          console.error(`❌ Background revalidation failed:`, error);
        } finally {
          inFlightIndexKeys.delete(mediaShelfIndexKey);
        }
      })();
    }

    const pipeline = redisClient.multi();

    mediaEntries.forEach((entry: string) => pipeline.get(`media:${entry}`));

    const pipelineResults = (await pipeline.exec()) || [];

    const mediaShelfCollection: TMDBMediaShelf[] = [];

    if (isTrending) {
      pipelineResults.forEach((result) => {
        if (typeof result === 'string') {
          mediaShelfCollection.push(JSON.parse(result));
        }
      });
    } else {
      const updatedMediaEntries: string[] = [];

      for (let i = 0; i < contentReferenceItems.length; i++) {
        const item = contentReferenceItems[i];
        const expectedEntry = `${item.mediaType}:${item.tmdbId}`;

        const cachedEntry = mediaEntries[i];
        const cachedResult = pipelineResults[i];

        if (typeof cachedResult !== 'string') {
          updatedMediaEntries.push(cachedEntry);
          console.warn(`⚠️ Cache miss: [${cachedEntry}]. Skipping.`);
          continue;
        }

        if (cachedEntry !== expectedEntry) {
          const mediaPayload = await fetchMediaShelfItem(item, featuredIds);

          if (mediaPayload) {
            mediaShelfCollection.push(mediaPayload);
            updatedMediaEntries.push(expectedEntry);
          }

          continue;
        }

        const parsedResult = JSON.parse(cachedResult);

        mediaShelfCollection.push(parsedResult);
        updatedMediaEntries.push(expectedEntry);
      }

      const indexChanged =
        updatedMediaEntries.length !== mediaEntries.length ||
        updatedMediaEntries.some(
          (entry, index) => entry !== mediaEntries[index],
        );

      if (indexChanged) {
        await syncMediaShelfIndex(
          mediaShelfIndexKey,
          mediaEntries,
          updatedMediaEntries,
        );
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(mediaShelfCollection));
    return;
  } else {
    if (inFlightIndexKeys.has(mediaShelfIndexKey)) {
      await waitForFlightIn(mediaShelfIndexKey);
      const retryCache = await redisClient.get(mediaShelfIndexKey);
      res.setHeader('Content-Type', 'application/json');

      if (retryCache) {
        const { mediaEntries } = JSON.parse(retryCache);

        const pipeline = redisClient.multi();

        mediaEntries.forEach((entry: string) => {
          pipeline.get(`media:${entry}`);
        });

        const pipelineResults = (await pipeline.exec()) || [];

        const mediaShelfCollection = pipelineResults
          .map((result) =>
            typeof result === 'string' ? JSON.parse(result) : null,
          )
          .filter(Boolean);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(mediaShelfCollection));
        return;
      }

      throw new Error(`Failed to retrieve media ${mediaShelfIndexKey}`);
    } else {
      inFlightIndexKeys.add(mediaShelfIndexKey);
      const mediaShelfCollection = await fetchFreshMediaData(
        featuredIds,
        mediaShelfIndexKey,
        [],
        mediaShelf,
        contentReferenceItems,
      ).finally(() => inFlightIndexKeys.delete(mediaShelfIndexKey));

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(mediaShelfCollection));
      return;
    }
  }
}

async function syncMediaShelfIndex(
  mediaShlefIndexKey: string,
  oldMediaEntries: string[],
  newMediaEntries: string[],
) {
  const jitter = Math.floor(Math.random() * 30 * 60 * 1000);

  await redisClient.set(
    mediaShlefIndexKey,
    JSON.stringify({
      mediaEntries: newMediaEntries,
      timestamp: Date.now() + jitter,
    }),
  );

  const addedEntries = newMediaEntries.filter(
    (id: string) => !oldMediaEntries.includes(id),
  );

  if (addedEntries.length > 0) {
    const pipeline = redisClient.multi();
    addedEntries.forEach((id) => pipeline.incr(`media-ref:${id}`));
    await pipeline.exec();
  }

  const removedEntries = oldMediaEntries.filter(
    (id: string) => !newMediaEntries.includes(id),
  );

  for (const id of removedEntries) {
    const refs = await redisClient.decr(`media-ref:${id}`);

    if (refs <= 0) {
      await redisClient.del(`media:${id}`);
      await redisClient.del(`media-ref:${id}`);
    }
  }
}

async function fetchMediaShelfItem(
  media: MediaReferanceItems,
  featuredIds: string[],
) {
  try {
    if (!featuredIds.includes(String(media.tmdbId))) {
      const tmdbData = (await fetchFromTMDB(media)) as any;
      const mediaPayload = parseMediaShelf(tmdbData, media.mediaType);

      await redisClient.set(
        `media:${mediaPayload.type}:${mediaPayload.id}`,
        JSON.stringify(mediaPayload),
      );

      return mediaPayload;
    }
  } catch (error: any) {
    console.error(
      `❌ Failed to fetch content ID ${media.tmdbId}. Status: ${error.statusCode ?? 'Unknown'} | Message: ${error.message}`,
    );
  }
}

async function fetchFreshMediaData(
  featuredIds: string[],
  mediaShlefIndexKey: string,
  oldMediaEntries: string[],
  mediaShelf: string,
  contentReferenceItems?: MediaReferanceItems[],
) {
  const mediaShelfCollection: TMDBMediaShelf[] = [];

  if (mediaShelf === 'trending-movies' || mediaShelf === 'trending-tv-shows') {
    try {
      const endpoint =
        mediaShelf === 'trending-movies'
          ? 'trending/movie/week'
          : 'trending/tv/week';

      const mediaType = mediaShelf === 'trending-movies' ? 'movie' : 'tv';

      const response = (await fetchFromTMDB({ endpoint })) as any;
      const tmdbResults = response.results || [];

      for (const tmdbData of tmdbResults) {
        if (!featuredIds.includes(String(tmdbData.id))) {
          const mediaPayload = parseMediaShelf(tmdbData, mediaType);
          mediaShelfCollection.push(mediaPayload);

          await redisClient.set(
            `media:${mediaPayload.type}:${mediaPayload.id}`,
            JSON.stringify(mediaPayload),
          );

          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }

      const newMediaEntries =
        tmdbResults.length > 0
          ? tmdbResults.map((tmdbData: any) => `${mediaType}:${tmdbData.id}`)
          : [];

      await syncMediaShelfIndex(
        mediaShlefIndexKey,
        oldMediaEntries,
        newMediaEntries,
      );
    } catch (error) {
      console.error(
        `❌ Failed fetching live trending content for ${mediaShelf}:`,
        {
          cause: error,
        },
      );
    }
  } else if (contentReferenceItems) {
    for (const item of contentReferenceItems) {
      const mediaPayload = await fetchMediaShelfItem(item, featuredIds);

      if (mediaPayload) {
        mediaShelfCollection.push(mediaPayload);
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    const newMediaEntries =
      contentReferenceItems.length > 0
        ? contentReferenceItems.map(
            (collection) => `${collection.mediaType}:${collection.tmdbId}`,
          )
        : [];

    await syncMediaShelfIndex(
      mediaShlefIndexKey,
      oldMediaEntries,
      newMediaEntries,
    );
  }

  return mediaShelfCollection;
}
