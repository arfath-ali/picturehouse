import type { ServerResponse } from 'node:http';
import { verifyAuth } from '../middlewares/verify-auth.js';
import type { IncomingRequest } from '../types/http.js';
import { pool } from '../database/pool.js';
import { sendJsonResponse } from '../http/send-json-response.js';

export async function deleteAvatar(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
) {
  await verifyAuth(req, res);

  await pool.query(
    `
    UPDATE users
    SET avatar_url = NULL
    WHERE id = $1
    `,
    [req.userId],
  );

  sendJsonResponse(res, 200, {
    success: true,
    avatar_url: null,
  });
}
