import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { searchTMDB } from '../api/tmdb-search.js';
import { inFlightActiveRequests } from '../utils/in-flight.js';
import { parseMediaSearch } from '../services/tmdb-parser.js';

export async function getMediaSearch(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!req.params) return;

  if (!req.params?.query || !req.params?.searchPage) return;

  const { query, searchPage } = req.params;

  const cacheKey = String(query?.toLowerCase().trim());

  let searchResults;

  if (inFlightActiveRequests.has(cacheKey)) {
    searchResults = await inFlightActiveRequests.get(cacheKey);
  } else {
    const fetchPromise = searchTMDB(query, searchPage).finally(() => {
      inFlightActiveRequests.delete(cacheKey);
    });

    inFlightActiveRequests.set(cacheKey, fetchPromise);
    searchResults = await fetchPromise;
  }

  const { mediaPayload, totalPages, totalResults } =
    parseMediaSearch(searchResults);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ mediaPayload, totalPages, totalResults }));
}
