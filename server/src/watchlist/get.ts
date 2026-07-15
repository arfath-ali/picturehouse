import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { pool } from '../database/pool.js';

export async function getWatchlist(req: IncomingMessage, res: ServerResponse) {
  const sortResult = await pool.query(`
      SELECT watchlist_sort_preference
      FROM users
      `);

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

  const result = await pool.query(`
      SELECT *
      FROM watchlist
     ORDER BY ${orderBy}
      `);

  const watchlist = result.rows;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ watchlistSortPreference, watchlist }));
  return;
}
