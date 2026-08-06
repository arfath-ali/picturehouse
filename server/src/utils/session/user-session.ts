import { pool } from '../../database/pool.js';
import { decodeJwt, generateToken } from './jwt.js';
import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../../types/http.js';
import { throwApiError } from '../../http/api-error.js';

export async function createUserSession(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
  userId: string,
) {
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'Unknown IP';

  const userAgent = req.headers['user-agent'] || 'Unknown Device';

  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const sevenDaysInSeconds = 7 * 24 * 60 * 60;
  const expiresAt = new Date(Date.now() + sevenDaysInMs);

  const {
    rows: [session],
  } = await pool.query(
    `
        INSERT INTO user_sessions(user_id, ip_address, user_agent, expires_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
    [userId, ipAddress, userAgent, expiresAt],
  );

  try {
    const token = generateToken(userId, session.id);

    res.setHeader(
      'Set-Cookie',
      `token=${token}; HttpOnly; SameSite=Lax; Max-Age=${sevenDaysInSeconds}; Path=/${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`,
    );
  } catch (tokenError) {
    await pool.query(`DELETE FROM user_sessions WHERE id = $1`, [session.id]);
    throw tokenError;
  }
}

export async function refreshUserSession(token: string, res: ServerResponse) {
  const expiredToken = decodeJwt(token);

  const {
    rows: [session],
  } = await pool.query(
    `
    SELECT expires_at
    FROM user_sessions
    WHERE id = $1 AND user_id = $2 AND expires_at > NOW()
    `,
    [expiredToken?.sessionId, expiredToken?.userId],
  );

  if (!session) {
    throwApiError(401, {
      code: 'SESSION_EXPIRED',
      message: 'session has expired.',
    });
  }

  const remainingMs = new Date(session.expires_at).getTime() - Date.now();
  const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

  if (remainingSeconds <= 0) {
    throwApiError(401, {
      code: 'SESSION_EXPIRED',
      message: 'session has expired.',
    });
  }

  if (expiredToken) {
    const newToken = generateToken(
      expiredToken?.userId,
      expiredToken?.sessionId,
    );

    res.setHeader(
      'Set-Cookie',
      `token=${newToken}; HttpOnly; SameSite=Lax; Max-Age=${remainingSeconds}; Path=/${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`,
    );
  } else {
    throwApiError(401, {
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token.',
    });
  }
}
