import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { pool } from '../database/pool.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import type { IncomingRequest } from '../types/http.js';

export async function getWatchlist(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
) {
  await verifyAuth(req, res);

  const sortResult = await pool.query(
    `
      SELECT watchlist_sort_preference
      FROM users
      WHERE id=$1
      `,
    [req.userId],
  );

  const watchlistSortPreference =
    sortResult.rows[0]?.watchlist_sort_preference ?? 'recently-added';

  let orderBy = 'created_at DESC';

  switch (watchlistSortPreference) {
    case 'oldest-added':
      orderBy = 'created_at ASC';
      break;

    case 'title-asc':
      orderBy = 'title ASC';
      break;

    case 'title-desc':
      orderBy = 'title DESC';
      break;
  }

  const { rows: watchlist } = await pool.query(
    `
  SELECT *
  FROM watchlist
  WHERE user_id=$1
  ORDER BY ${orderBy}
`,
    [req.userId],
  );

  sendJsonResponse(res, 200, {
    success: true,
    watchlistSortPreference,
    watchlist,
  });
}
