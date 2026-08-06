import type { ServerResponse } from 'node:http';
import { pool } from '../database/pool.js';
import type { IncomingRequest } from '../types/http.js';
import type { watchlistSortPreferenceBody } from '../types/watchlist.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import { verifyAuth } from '../middlewares/verify-auth.js';

export async function updateWatchlistSortPreference(
  req: IncomingRequest<watchlistSortPreferenceBody>,
  res: ServerResponse,
) {
  await verifyAuth(req, res);

  const { watchlistSortPreference } = req.body;

  await pool.query(
    `
        UPDATE users
        SET watchlist_sort_preference = $1
        where id =$2
      `,
    [watchlistSortPreference, req.userId],
  );
  sendJsonResponse(res, 200, {
    success: true,
  });
}
