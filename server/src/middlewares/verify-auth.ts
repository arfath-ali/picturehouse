import type { IncomingRequest } from '../types/http.js';
import { throwApiError } from '../http/api-error.js';
import { decodeJwt, verifyJwt } from '../utils/session/jwt.js';
import type { TokenPayload } from '../types/jwt.js';
import type { ServerResponse } from 'node:http';
import { refreshUserSession } from '../utils/session/user-session.js';

export async function verifyAuth(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
) {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    throwApiError(401, {
      code: 'MISSING_TOKEN',
      message: 'Authentication token is missing.',
    });
  }

  const token = cookieHeader
    .split(';')
    .find((cookie) => cookie.trim().startsWith('token'))
    ?.split('=')[1];

  if (!token) {
    throwApiError(401, {
      code: 'MISSING_TOKEN',
      message: 'Authentication token is missing.',
    });
  }

  let decodedToken: TokenPayload;

  try {
    decodedToken = verifyJwt(token);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      await refreshUserSession(token, res);

      decodedToken = decodeJwt(token);
    } else {
      throwApiError(401, {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token.',
      });
    }
  }

  if (!decodedToken || !decodedToken.userId || !decodedToken.sessionId) {
    throwApiError(401, {
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired authentication token.',
    });
  }

  req.userId = decodedToken.userId;
  req.sessionId = decodedToken.sessionId;
}
