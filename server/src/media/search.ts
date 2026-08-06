import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { searchTMDB } from '../api/tmdb-search.js';
import { inFlightActiveRequests } from '../utils/in-flight.js';
import { parseMediaSearch } from '../services/tmdb-parser.js';
import { sendJsonResponse } from '../http/send-json-response.js';

export async function getMediaSearch(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!req.params) return;

  if (!req.params?.query || !req.params?.searchPage) return;

  const { query, searchPage } = req.params;

  const cacheKey = String(query?.toLowerCase().trim());

  let tmdbSearchResults;

  if (inFlightActiveRequests.has(cacheKey)) {
    tmdbSearchResults = await inFlightActiveRequests.get(cacheKey);
  } else {
    const fetchPromise = searchTMDB(query, searchPage).finally(() => {
      inFlightActiveRequests.delete(cacheKey);
    });

    inFlightActiveRequests.set(cacheKey, fetchPromise);
    tmdbSearchResults = await fetchPromise;
  }

  const { mediaPayload, totalPages, totalResults } =
    parseMediaSearch(tmdbSearchResults);

  sendJsonResponse(res, 200, {
    success: true,
    searchResults: mediaPayload,
    totalPages,
    totalResults,
  });
}
