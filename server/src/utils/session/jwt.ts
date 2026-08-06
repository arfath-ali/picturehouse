import jwt from 'jsonwebtoken';
import { throwApiError } from '../../http/api-error.js';
import type { TokenPayload } from '../../types/jwt.js';

export function generateToken(userId: string, sessionId: string) {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;

  if (!jwtSecretKey) {
    throwApiError(500, {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Server security configuration is missing.',
    });
  }

  return jwt.sign({ userId, sessionId }, jwtSecretKey, { expiresIn: '5s' });
}

export function verifyJwt(token: string): TokenPayload {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;

  if (!jwtSecretKey) {
    throwApiError(500, {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Server security configuration is missing.',
    });
  }
  return jwt.verify(token, jwtSecretKey) as TokenPayload;
}

export function decodeJwt(token: string): TokenPayload {
  return jwt.decode(token) as TokenPayload;
}
