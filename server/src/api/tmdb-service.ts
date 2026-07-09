import type { MediaReferanceItems } from '../types/media-reference-items.js';

export type TMDBEndpointQuery = {
  endpoint: string;
};

export default async function fetchFromTMDB(
  query: MediaReferanceItems | TMDBEndpointQuery,
) {
  let url = '';

  if ('endpoint' in query) {
    url = `${process.env.TMDB_BASE_URL}/${query.endpoint}?api_key=${process.env.TMDB_API_KEY}`;
  } else {
    const mediaMetaData =
      query.mediaType === 'tv' ? 'content_ratings' : 'release_dates';

    url = `${process.env.TMDB_BASE_URL}/${query.mediaType}/${query.tmdbId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=external_ids,images,${mediaMetaData},credits,videos,watch/providers`;
  }
  const makeRequest = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, { signal: controller.signal });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => {});
        console.error('DEBUG: TMDB API Error:', {
          status: response.status,
          url: url,
          data: errorData,
        });

        const error: any = new Error('TMDB_FETCH_FAILED');
        error.status = response.status;
        throw error;
      }

      const data = await response.json();

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        const timeoutError: any = new Error(
          'Request timed out after 5 seconds',
        );
        timeoutError.status = 408;
        throw timeoutError;
      }

      if (error.status) throw error;

      const networkError: any = new Error(
        `Connection failed: ${error.message}`,
      );

      networkError.status = 0;
      throw networkError;
    }
  };

  const MAX_ATTEMPTS = 20;
  let delay = 400;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await makeRequest();
    } catch (error: any) {
      const permanentErrors = [401, 404, 422, 500, 502];
      const status = error.status !== undefined ? error.status : 0;

      const identity =
        'endpoint' in query
          ? query.endpoint
          : `${query.mediaType} (ID: ${query.tmdbId})`;

      if (permanentErrors.includes(status)) {
        const permanentError: any = new Error();

        permanentError.status = status;

        switch (status) {
          case 401:
            permanentError.message = 'TMDB authentication failed';
            break;

          case 404:
            permanentError.message = 'TMDB Media not found';
            break;

          case 422:
            permanentError.message = 'Invalid TMDB request';
            break;

          case 500:
            permanentError.message = 'TMDB internal server error';
            break;

          case 502:
            permanentError.message = 'TMDB gateway error';
            break;

          default:
            permanentError.message = 'TMDB request failed';
        }
        console.error(
          `❌ [${error.status}] Critical Error for ${identity}: ${error.message}`,
        );
        throw permanentError;
      } else {
        if (attempt === MAX_ATTEMPTS) {
          console.error(
            `❌ [Final Failure] All ${MAX_ATTEMPTS} attempts exhausted.`,
          );

          const finalError: any = new Error(error.message);
          finalError.status = status;
          throw finalError;
        }

        console.warn(
          `⚠️ [Retry ${attempt}/${MAX_ATTEMPTS}] ${identity} failed. Status: ${status}. Reason: ${error.message}. Retrying in ${delay}ms...`,
        );

        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
}
