import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { pool } from '../database/pool.js';

export async function removeFromWatchlist(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!req.params) return;

  const { mediaType, mediaId } = req.params;

  const result = await pool.query(
    `
  SELECT EXISTS(
    SELECT 1
    FROM watchlist
    WHERE id = $1 AND type = $2
  ) AS exists
  `,
    [mediaId, mediaType],
  );

  const isMediaExists = result.rows[0].exists;

  if (isMediaExists) {
    await pool.query(
      `
            DELETE FROM watchlist
            WHERE id = $1 AND type = $2
            `,
      [mediaId, mediaType],
    );

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ isWatchlisted: false }));
    return;
  }
}
