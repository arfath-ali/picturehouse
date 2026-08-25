import type { IncomingMessage, ServerResponse } from 'node:http';
import type { TMDBMediaFeatured } from '../types/tmdb-content.js';
import fetchFromTMDB from '../api/tmdb-service.js';
import { redisClient } from '../cache/redis.js';
import type { MediaReferanceItems } from '../types/media-reference-items.js';
import { parseMediaFeatured } from '../services/tmdb-parser.js';
import { inFlightIndexKeys, waitForFlightIn } from '../utils/in-flight.js';
import type { ApiErrorResponse } from '../types/errors.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import type { IncomingRequest } from '../types/http.js';
import featuredData from '../data/featured.json' with { type: 'json' };

export async function getMediaFeatured(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
) {
  if (!req.params) return;

  const { page } = req.params;
  if (!page) return;

  const featured = featuredData as Record<string, MediaReferanceItems[]>;
  const contentReferenceItems = featured[page];

  if (!contentReferenceItems) {
    throw new Error(`Missing media shelf for page "${page}" in featured.json`);
  }
  const featuredIndexKey = `featured-${page}`;
  const cachedIndexData = await redisClient.get(featuredIndexKey);
  if (cachedIndexData) {
    const { mediaEntries, timestamp } = JSON.parse(cachedIndexData);
    const isCacheExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;

    if (isCacheExpired && !inFlightIndexKeys.has(featuredIndexKey)) {
      inFlightIndexKeys.add(featuredIndexKey);
      (async () => {
        try {
          await fetchFreshHeroData(
            featuredIndexKey,
            mediaEntries,
            contentReferenceItems,
          );
        } catch (error) {
          console.error(`❌ Background revalidation failed:`, error);
        } finally {
          inFlightIndexKeys.delete(featuredIndexKey);
        }
      })();
    }

    const pipeline = redisClient.multi();

    mediaEntries.forEach((entry: string) => pipeline.get(`media:${entry}`));

    const pipelineResults = (await pipeline.exec()) || [];

    const featuredCollection: TMDBMediaFeatured[] = [];
    const updatedMediaEntries: string[] = [];

    for (let i = 0; i < contentReferenceItems.length; i++) {
      const item = contentReferenceItems[i];
      const expectedEntry = `${item.mediaType}:${item.tmdbId}`;

      const cachedEntry = mediaEntries[i];
      const cachedResult = pipelineResults[i];

      if (cachedEntry !== expectedEntry) {
        const mediaPayload = await fetchFeaturedItem(item);

        if (mediaPayload) {
          featuredCollection.push(mediaPayload);
          updatedMediaEntries.push(expectedEntry);
        }

        continue;
      }

      if (typeof cachedResult !== 'string') {
        updatedMediaEntries.push(cachedEntry);
        console.warn(`⚠️ Cache miss: [${cachedEntry}]. Skipping...`);
        continue;
      }

      const parsedResult = JSON.parse(cachedResult);

      if (
        parsedResult.schema !== 'featured' &&
        parsedResult.schema !== 'details'
      ) {
        const mediaPayload = await fetchFeaturedItem(item);
        if (mediaPayload) {
          featuredCollection.push(mediaPayload);
          updatedMediaEntries.push(expectedEntry);
        }
        continue;
      }

      featuredCollection.push(parsedResult);
      updatedMediaEntries.push(expectedEntry);
    }

    const indexChanged =
      updatedMediaEntries.length !== mediaEntries.length ||
      updatedMediaEntries.some((entry, index) => entry !== mediaEntries[index]);

    if (indexChanged) {
      await syncFeaturedIndex(
        featuredIndexKey,
        mediaEntries,
        updatedMediaEntries,
      );
    }

    sendJsonResponse(res, 200, { success: true, featuredCollection });
    return;
  } else {
    if (inFlightIndexKeys.has(featuredIndexKey)) {
      await waitForFlightIn(featuredIndexKey);
      const retryCache = await redisClient.get(featuredIndexKey);
      res.setHeader('Content-Type', 'application/json');

      if (retryCache) {
        const { mediaEntries } = JSON.parse(retryCache);

        const pipeline = redisClient.multi();

        mediaEntries.forEach((entry: string) => {
          pipeline.get(`media:${entry}`);
        });

        const pipelineResults = (await pipeline.exec()) || [];

        const featuredCollection = pipelineResults
          .map((result) =>
            typeof result === 'string' ? JSON.parse(result) : null,
          )
          .filter(Boolean);

        sendJsonResponse(res, 200, { success: true, featuredCollection });
        return;
      }

      throw new Error(`Failed to retrieve media for ${featuredIndexKey}`);
    } else {
      inFlightIndexKeys.add(featuredIndexKey);

      const featuredCollection = await fetchFreshHeroData(
        featuredIndexKey,
        [],
        contentReferenceItems,
      ).finally(() => inFlightIndexKeys.delete(featuredIndexKey));

      sendJsonResponse(res, 200, { success: true, featuredCollection });
      return;
    }
  }
}

async function fetchFeaturedItem(media: MediaReferanceItems) {
  try {
    const tmdbData = (await fetchFromTMDB(media)) as any;
    const mediaPayload = await parseMediaFeatured(tmdbData, media.mediaType);

    await redisClient.set(
      `media:${mediaPayload.type}:${mediaPayload.id}`,
      JSON.stringify(mediaPayload),
    );
    return mediaPayload;
  } catch (error: unknown) {
    console.error(
      `❌ Failed to fetch content ID ${media.tmdbId}. Status: ${(error as ApiErrorResponse).status ?? 'Unknown'} | Message: ${(error as ApiErrorResponse).message}`,
    );
  }
}

async function syncFeaturedIndex(
  featuredIndexKey: string,
  oldMediaEntries: string[],
  newMediaEntries: string[],
) {
  const jitter = Math.floor(Math.random() * 30 * 60 * 1000);

  await redisClient.set(
    featuredIndexKey,
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

async function fetchFreshHeroData(
  featuredIndexKey: string,
  oldMediaEntries: string[],
  contentReferenceItems: MediaReferanceItems[],
) {
  const featuredCollection: TMDBMediaFeatured[] = [];

  for (const item of contentReferenceItems) {
    const mediaPayload = await fetchFeaturedItem(item);

    if (mediaPayload) {
      featuredCollection.push(mediaPayload);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const newMediaEntries =
    contentReferenceItems.length > 0
      ? contentReferenceItems.map(
          (collection) => `${collection.mediaType}:${collection.tmdbId}`,
        )
      : [];

  await syncFeaturedIndex(featuredIndexKey, oldMediaEntries, newMediaEntries);

  return featuredCollection;
}
