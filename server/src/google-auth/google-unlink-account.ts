import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../types/http.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import { pool } from '../database/pool.js';
import type { GoogleUserProfile } from '../types/google-auth.js';

export async function unlinkGoogleAccount(
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
  } = await pool.query(
    `SELECT google_id, password, email FROM users WHERE id = $1`,
    [req.userId],
  );

  if (!currentUser) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=USER_NOT_FOUND&mode=${mode}`,
    });
    res.end();
    return;
  }

  if (
    !currentUser.google_id ||
    currentUser.google_id !== userProfile.sub ||
    currentUser.email.toLowerCase() !== userProfile.email.toLowerCase()
  ) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=GOOGLE_ACCOUNT_MISMATCH&mode=${mode}`,
    });
    res.end();
    return;
  }

  if (!currentUser.password) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=PASSWORD_REQUIRED&mode=${mode}`,
    });
    res.end();
    return;
  }

  await pool.query(
    `UPDATE users
     SET google_id = NULL
     WHERE id = $1
    `,
    [req.userId],
  );

  res.writeHead(302, {
    Location: `${FRONTEND_REDIRECT_URL}?status=success&user_id=${req.userId}&mode=${mode}`,
  });
  res.end();
}
