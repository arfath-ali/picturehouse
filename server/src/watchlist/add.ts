import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import type { WatchlistItem } from '../types/watchlist-item.js';
import { pool } from '../database/pool.js';

export async function addToWatchlist(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const mediaPayload = req.body as WatchlistItem;

  const isMediaExists = (
    await pool.query(
      `SELECT EXISTS(
    SELECT 1
    FROM watchlist
    WHERE id = $1 AND type = $2
    ) AS exists`,
      [mediaPayload.id, mediaPayload.type],
    )
  ).rows[0].exists;

  if (!isMediaExists) {
    await pool.query(
      `
      INSERT INTO watchlist(id, type, title, images)
      VALUES($1, $2, $3, $4)
      `,
      [
        mediaPayload.id,
        mediaPayload.type,
        mediaPayload.title,
        mediaPayload.images,
      ],
    );
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ isWatchlisted: true }));
  return;
}
