import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { pool } from '../database/pool.js';

export async function updateWatchlistSortPreference(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const watchlistSortPreference = req.body as any;

  await pool.query(
    `
        UPDATE users
        SET watchlist_sort_preference = $1
        WHERE id = 1
      `,
    [watchlistSortPreference],
  );
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: true }));
}
