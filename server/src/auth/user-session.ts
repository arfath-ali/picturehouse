import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { pool } from '../database/pool.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import type { IncomingRequest } from '../types/http.js';
import { sendJsonResponse } from '../http/send-json-response.js';

export async function checkUserSession(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
) {
  let isUserAuthenticated = false;

  let avatarURL: string | null = null;

  let isGoogleUser: boolean = false;

  let hasPassword: boolean = false;

  try {
    verifyAuth(req, res);

    isUserAuthenticated = true;

    const {
      rows: [user],
    } = await pool.query(
      'SELECT google_id, avatar_url, password FROM users WHERE id = $1',

      [req.userId],
    );

    avatarURL = user?.avatar_url ?? null;

    isGoogleUser = Boolean(user?.google_id);

    hasPassword = Boolean(user?.password);
  } catch {
    isUserAuthenticated = false;
  }

  sendJsonResponse(res, 200, {
    success: true,
    avatar_url: avatarURL,
    user_id: req.userId,
    is_google_user: isGoogleUser,
    has_password: hasPassword,
  });
}
