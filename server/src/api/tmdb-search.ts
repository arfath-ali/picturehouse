import type { ApiErrorResponse } from '../types/errors.js';

export async function searchTMDB(query: string, searchPage: string) {
  const url = `${process.env.TMDB_BASE_URL}/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${query}&language=en-US&page=${searchPage}`;

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

        const error = new Error('TMDB_FETCH_FAILED') as ApiErrorResponse;
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      const error = err as Error & { status?: number };

      if (error.name === 'AbortError') {
        const timeoutError = new Error(
          'Request timed out after 5 seconds',
        ) as ApiErrorResponse;
        timeoutError.status = 408;
        throw timeoutError;
      }

      if (error.status) throw error;

      const networkError = new Error(
        `Connection failed: ${error.message}`,
      ) as ApiErrorResponse;
      networkError.status = 0;
      throw networkError;
    }
  };

  const MAX_ATTEMPTS = 20;
  let delay = 400;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await makeRequest();
    } catch (err: unknown) {
      const permanentErrors = [401, 404, 422, 500, 502];

      const error = err as Error & {
        status?: number;
      };

      const status = error.status !== undefined ? error.status : 0;

      if (permanentErrors.includes(status)) {
        console.error(
          `❌ [${status}] Critical Error for ${query}: ${error.message}`,
        );

        const permanentError = new Error() as ApiErrorResponse;

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

        throw permanentError;
      } else {
        if (attempt === MAX_ATTEMPTS) {
          console.error(
            `❌ [Final Failure] All ${MAX_ATTEMPTS} attempts exhausted.`,
          );

          const finalError = new Error(error.message) as ApiErrorResponse;
          finalError.status = status;
          throw finalError;
        }

        console.warn(
          `⚠️ [Retry ${attempt}/${MAX_ATTEMPTS}] (${query}) failed. Status: ${status}. Reason: ${error.message}. Retrying in ${delay}ms...`,
        );

        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
}
