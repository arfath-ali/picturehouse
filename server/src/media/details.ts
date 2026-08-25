import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { redisClient } from '../cache/redis.js';
import fetchFromTMDB from '../api/tmdb-service.js';
import type { MediaReferanceItems } from '../types/media-reference-items.js';
import { parseMediaDetails } from '../services/tmdb-parser.js';
import { enrichMediaWithRatings } from '../services/media-rating.js';
import { inFlightIndexKeys, waitForFlightIn } from '../utils/in-flight.js';
import type { TMDBMediaDetails } from '../types/tmdb-content.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import type { IncomingRequest } from '../types/http.js';

export async function getMediaDetails(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
) {
  if (!req.params) return;

  const { mediaType, tmdbId } = req.params;

  if (!mediaType || !tmdbId) return;

  const mediaDetailsIndexKey = `media:${mediaType}:${tmdbId}`;
  const cachedMediaDetails = await redisClient.get(mediaDetailsIndexKey);
  const mediaPayload: TMDBMediaDetails | null = cachedMediaDetails
    ? JSON.parse(cachedMediaDetails)
    : null;

  if (mediaPayload && mediaPayload.schema === 'details') {
    const hasRatingsData =
      mediaPayload.ratings?.imdb || mediaPayload.ratings?.rottenTomatoes;

    if (hasRatingsData) {
      const isRatingCacheExpired =
        Date.now() - mediaPayload.lastUpdated > 15 * 60 * 1000;

      if (
        isRatingCacheExpired &&
        !inFlightIndexKeys.has(mediaDetailsIndexKey)
      ) {
        inFlightIndexKeys.add(mediaDetailsIndexKey);
        (async () => {
          try {
            await enrichMediaWithRatings(mediaPayload);
          } catch (error) {
            const mediaId = mediaPayload.id;
            const mediaType = mediaPayload.type;
            console.error(
              `[Background Task] Failed to refresh ratings for ${mediaType} (${mediaId}):`,
              error,
            );
          } finally {
            inFlightIndexKeys.delete(mediaDetailsIndexKey);
          }
        })();
      }
      sendJsonResponse(res, 200, { success: true, mediaDetails: mediaPayload });
      return;
    } else if (!inFlightIndexKeys.has(mediaDetailsIndexKey)) {
      inFlightIndexKeys.add(mediaDetailsIndexKey);

      await enrichMediaWithRatings(mediaPayload).finally(() =>
        inFlightIndexKeys.delete(mediaDetailsIndexKey),
      );
      sendJsonResponse(res, 200, { success: true, mediaDetails: mediaPayload });
      return;
    }
  } else {
    if (inFlightIndexKeys.has(mediaDetailsIndexKey)) {
      await waitForFlightIn(mediaDetailsIndexKey);
      const retryMediaPayloadCache =
        await redisClient.get(mediaDetailsIndexKey);

      if (retryMediaPayloadCache) {
        sendJsonResponse(res, 200, {
          success: true,
          mediaDetails: retryMediaPayloadCache,
        });
        return;
      }
      throw new Error(`Failed to retrieve ${mediaDetailsIndexKey}`);
    } else {
      inFlightIndexKeys.add(mediaDetailsIndexKey);
      const media: MediaReferanceItems = { tmdbId, mediaType };
      try {
        const tmdbData = (await fetchFromTMDB(media)) as any;

        const mediaPayload = await parseMediaDetails(tmdbData, mediaType);

        await enrichMediaWithRatings(mediaPayload);

        sendJsonResponse(res, 200, {
          success: true,
          mediaDetails: mediaPayload,
        });
        return;
      } finally {
        inFlightIndexKeys.delete(mediaDetailsIndexKey);
      }
    }
  }
}
