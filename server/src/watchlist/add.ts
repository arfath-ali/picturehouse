import type { ServerResponse } from 'node:http';
import type { WatchlistBody } from '../types/watchlist.js';
import { pool } from '../database/pool.js';
import type { IncomingRequest } from '../types/http.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import { verifyAuth } from '../middlewares/verify-auth.js';

export async function addToWatchlist(
  req: IncomingRequest<WatchlistBody>,
  res: ServerResponse,
) {
  await verifyAuth(req, res);

  const mediaPayload = req.body;

  await pool.query(
    `
      INSERT INTO watchlist(id, user_id, type, title, images)
      VALUES($1, $2, $3, $4, $5)
      `,
    [
      mediaPayload.id,
      req.userId,
      mediaPayload.type,
      mediaPayload.title,
      mediaPayload.images,
    ],
  );

  sendJsonResponse(res, 200, { success: true, isWatchlisted: true });
}
