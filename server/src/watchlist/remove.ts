import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { pool } from '../database/pool.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import type { IncomingRequest } from '../types/http.js';
import { verifyAuth } from '../middlewares/verify-auth.js';

export async function removeFromWatchlist(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
) {
  await verifyAuth(req, res);

  if (!req.params) return;

  const { mediaType, mediaId } = req.params;

  await pool.query(
    `
            DELETE FROM watchlist
            WHERE id = $1 AND user_id=$2 AND type = $3
            `,
    [mediaId, req.userId, mediaType],
  );

  sendJsonResponse(res, 200, { success: true, isWatchlisted: false });
}
