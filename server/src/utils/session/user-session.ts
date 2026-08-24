import { pool } from '../../database/pool.js';
import { decodeJwt, generateToken } from './jwt.js';
import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../../types/http.js';
import { throwApiError } from '../../http/api-error.js';
import type { UserSessionScope } from '../../types/session-scope.js';
import type { TokenPayload } from '../../types/jwt.js';

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
    const isProd = process.env.NODE_ENV === 'production';

    res.setHeader(
      'Set-Cookie',
      `token=${token}; HttpOnly; SameSite=Lax; Max-Age=${sevenDaysInSeconds}; Path=/;${isProd ? ' Secure;' : ''}`,
    );
  } catch (tokenError) {
    await pool.query(`DELETE FROM user_sessions WHERE id = $1`, [session.id]);
    throw tokenError;
  }
}

export async function refreshUserSession(
  token: string,
  res: ServerResponse,
): Promise<TokenPayload> {
  const expiredToken = decodeJwt(token);

  if (!expiredToken?.sessionId || !expiredToken?.userId) {
    throwApiError(401, {
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token.',
    });
  }

  const {
    rows: [session],
  } = await pool.query(
    `
    SELECT expires_at, updated_at
    FROM user_sessions
    WHERE id = $1 AND user_id = $2 AND expires_at > NOW()
    `,
    [expiredToken.sessionId, expiredToken.userId],
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

  if (session.updated_at) {
    const timeSinceLastUpdate =
      Date.now() - new Date(session.updated_at).getTime();
    if (timeSinceLastUpdate < 10000) {
      return expiredToken;
    }
  }

  await pool.query(
    `UPDATE user_sessions SET updated_at = NOW() WHERE id = $1`,
    [expiredToken.sessionId],
  );

  const newToken = generateToken(expiredToken.userId, expiredToken.sessionId);

  const isProd = process.env.NODE_ENV === 'production';

  if (res) {
    res.setHeader(
      'Set-Cookie',
      `token=${newToken}; HttpOnly; SameSite=Lax; Max-Age=${remainingSeconds}; Path=/;${isProd ? ' Secure;' : ''}`,
    );
  }

  return expiredToken;
}

export async function destroyUserSession(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
  scope: UserSessionScope,
) {
  if (scope === 'current') {
    await pool.query(`DELETE FROM user_sessions WHERE id = $1`, [
      req.sessionId,
    ]);
  } else if (scope === 'all') {
    await pool.query(`DELETE FROM user_sessions WHERE user_id = $1`, [
      req.userId,
    ]);
  }

  const isProd = process.env.NODE_ENV === 'production';

  res.setHeader(
    'Set-Cookie',
    `token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/;${isProd ? ' Secure;' : ''}`,
  );
}
