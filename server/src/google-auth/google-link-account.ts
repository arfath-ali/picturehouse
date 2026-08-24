import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../types/http.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import { pool } from '../database/pool.js';
import type { GoogleUserProfile } from '../types/google-auth.js';

export async function linkGoogleAccount(
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
  } = await pool.query(`SELECT email FROM users WHERE id = $1`, [req.userId]);

  if (!currentUser) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=USER_NOT_FOUND&mode=${mode}`,
    });
    res.end();
    return;
  }

  if (currentUser.email.toLowerCase() !== userProfile.email.toLowerCase()) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=GOOGLE_ACCOUNT_MISMATCH&mode=${mode}`,
    });
    res.end();
    return;
  }

  const { rows: existingGoogleUsers } = await pool.query(
    `SELECT id FROM users WHERE google_id = $1 AND id != $2`,
    [userProfile.sub, req.userId],
  );

  if (existingGoogleUsers.length > 0) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=GOOGLE_ACCOUNT_ALREADY_LINKED&mode=${mode}`,
    });
    res.end();
    return;
  }

  await pool.query(
    `UPDATE users
       SET google_id = $1,
           avatar_url = COALESCE(avatar_url, $2)
       WHERE id = $3
      `,
    [userProfile.sub, userProfile.picture, req.userId],
  );

  res.writeHead(302, {
    Location: `${FRONTEND_REDIRECT_URL}?status=success&user_id=${req.userId}&mode=${mode}`,
  });
  res.end();
}
