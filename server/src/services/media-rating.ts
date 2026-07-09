import fetchFromOMDB from '../api/omdb-service.js';
import { redisClient } from '../cache/redis.js';
import type { TMDBMediaDetails } from '../types/tmdb-content.js';

export async function enrichMediaWithRatings(mediaPayload: TMDBMediaDetails) {
  const imdbId = mediaPayload.imdbId;

  const omdbDetails =
    imdbId && !mediaPayload.ratings.checked
      ? ((await fetchFromOMDB(imdbId)) as any)
      : null;

  const imdbRating =
    omdbDetails?.Ratings?.find(
      (rating: { Source: string; Value: string }) =>
        rating.Source === 'Internet Movie Database',
    )?.Value ?? null;

  const rottenTomatoes =
    omdbDetails?.Ratings?.find(
      (rating: { Source: string; Value: string }) =>
        rating.Source === 'Rotten Tomatoes',
    )?.Value ?? null;

  mediaPayload.ratings.imdb = imdbRating;
  mediaPayload.ratings.rottenTomatoes = rottenTomatoes;
  mediaPayload.lastUpdated = Date.now();

  await redisClient.set(
    `media:${mediaPayload.type}:${mediaPayload.id}`,
    JSON.stringify(mediaPayload),
  );
}
