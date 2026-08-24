import type { ServerResponse } from 'node:http';
import type {
  GoogleTokenResponse,
  GoogleUserProfile,
} from '../types/google-auth.js';
import { pool } from '../database/pool.js';
import { createUserSession } from '../utils/session/user-session.js';
import type { IncomingRequest } from '../types/http.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import { generateUniqueUsername } from '../utils/generate-username.js';
import { linkGoogleAccount } from './google-link-account.js';
import { deleteAccount } from '../auth/delete-account.js';
import { deleteGoogleAccount } from './google-delete-account.js';
import { unlinkGoogleAccount } from './google-unlink-account.js';

export async function googleAuthCallback(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
) {
  const {
    GOOGLE_OAUTH_TOKEN_URL,
    GOOGLE_OAUTH_USER_INFO_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    FRONTEND_REDIRECT_URL,
  } = process.env;

  if (
    !GOOGLE_OAUTH_TOKEN_URL ||
    !GOOGLE_OAUTH_USER_INFO_URL ||
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_REDIRECT_URI ||
    !FRONTEND_REDIRECT_URL
  ) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL ?? 'http://localhost:8000'}?status=error&code=SERVER_CONFIG_ERROR`,
    });
    res.end();
    return;
  }

  const queryString = req.url?.split('?')[1] ?? '';
  const params = new URLSearchParams(queryString);
  const code = params.get('code');
  const mode = params.get('state');
  const error = params.get('error');

  if (error) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=GOOGLE_AUTH_FAILED${mode ? `&mode=${mode}` : ''}`,
    });
    res.end();
    return;
  }

  if (!code || !mode) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=INVALID_CALLBACK_PARAMS${mode ? `&mode=${mode}` : ''}`,
    });
    res.end();
    return;
  }

  const googleTokenParams = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const googleTokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: googleTokenParams.toString(),
  });

  if (!googleTokenResponse.ok) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=TOKEN_EXCHANGE_FAILED&mode=${mode}`,
    });
    res.end();
    return;
  }

  const googleTokens =
    (await googleTokenResponse.json()) as GoogleTokenResponse;

  const userProfileResponse = await fetch(GOOGLE_OAUTH_USER_INFO_URL, {
    headers: {
      Authorization: `Bearer ${googleTokens.access_token}`,
    },
  });

  if (!userProfileResponse.ok) {
    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=error&code=USER_INFO_FAILED&mode=${mode}`,
    });
    res.end();
    return;
  }

  const userProfile = (await userProfileResponse.json()) as GoogleUserProfile;

  if (mode === 'signin') {
    const username = await generateUniqueUsername(userProfile);

    const {
      rows: [user],
    } = await pool.query(
      `INSERT INTO users(google_id, avatar_url, full_name, username,email, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT(email)
       DO UPDATE SET
           google_id = EXCLUDED.google_id,
           avatar_url = COALESCE(users.avatar_url, EXCLUDED.avatar_url),
           full_name = EXCLUDED.full_name,
           username = COALESCE(users.username, EXCLUDED.username),
           is_verified = TRUE
       RETURNING id
      `,
      [
        userProfile.sub,
        userProfile.picture,
        userProfile.name,
        username,
        userProfile.email,
        userProfile.email_verified ?? true,
      ],
    );

    await createUserSession(req, res, user.id);

    res.writeHead(302, {
      Location: `${FRONTEND_REDIRECT_URL}?status=success&user_id=${user.id}&mode=${mode}`,
    });
    res.end();
    return;
  }

  if (mode === 'link-account') {
    await linkGoogleAccount(req, res, FRONTEND_REDIRECT_URL, mode, userProfile);
    return;
  }

  if (mode === 'unlink-account') {
    await unlinkGoogleAccount(
      req,
      res,
      FRONTEND_REDIRECT_URL,
      mode,
      userProfile,
    );
    return;
  }

  if (mode === 'delete') {
    await deleteGoogleAccount(
      req,
      res,
      FRONTEND_REDIRECT_URL,
      mode,
      userProfile,
    );
    return;
  }

  res.writeHead(302, {
    Location: `${FRONTEND_REDIRECT_URL}?status=error&code=INVALID_MODE&mode=${mode}`,
  });
  res.end();
}
