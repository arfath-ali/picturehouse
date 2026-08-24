import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../types/http.js';
import type { GoogleUserProfile } from '../types/google-auth.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import { pool } from '../database/pool.js';
import { destroyUserSession } from '../utils/session/user-session.js';

export async function deleteGoogleAccount(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
  FRONTEND_REDIRECT_URL: string,
  mode: string,
  userProfile: GoogleUserProfile,
) {
  try {
    await verifyAuth(req, res);
  } catch {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=SESSION_EXPIRED&mode=${mode}`,
    });
    res.end();
    return;
  }

  const {
    rows: [currentUser],
  } = await pool.query(`SELECT google_id, email FROM users WHERE id = $1`, [
    req.userId,
  ]);

  if (!currentUser) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=USER_NOT_FOUND&mode=${mode}`,
    });
    res.end();
    return;
  }

  if (
    currentUser.email.toLowerCase() !== userProfile.email.toLowerCase() ||
    (currentUser.google_id && currentUser.google_id !== userProfile.sub)
  ) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=GOOGLE_ACCOUNT_MISMATCH&mode=${mode}`,
    });
    res.end();
    return;
  }

  await pool.query(`DELETE FROM users WHERE id = $1`, [req.userId]);

  await destroyUserSession(req, res, 'all');

  res.writeHead(302, {
    Location: `${FRONTEND_REDIRECT_URL}?status=deleted&user_id=${req.userId}&mode=${mode}`,
  });
  res.end();
}
