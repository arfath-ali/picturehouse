import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../types/http.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import { pool } from '../database/pool.js';
import { throwApiError } from '../http/api-error.js';

export async function getProfile(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
) {
  await verifyAuth(req, res);

  const {
    rows: [user],
  } = await pool.query(
    `
      SELECT id, google_id, avatar_url, full_name, username, email, password
      FROM users
      WHERE id=$1
      `,
    [req.userId],
  );

  if (!user) {
    throwApiError(404, {
      code: 'USER_NOT_FOUND',
      message: 'Account not found. Please sign in or create a new account.',
    });
  }

  sendJsonResponse(res, 200, {
    success: true,
    user_id: user.id,
    avatar_url: user.avatar_url,
    full_name: user.full_name,
    username: user.username,
    email: user.email,
    is_google_user: Boolean(user.google_id),
    has_password: Boolean(user.password),
  });
}
