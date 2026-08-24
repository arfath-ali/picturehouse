import type { ServerResponse } from 'node:http';
import bcrypt from 'bcrypt';
import { pool } from '../database/pool.js';
import { throwApiError } from '../http/api-error.js';
import type { IncomingRequest } from '../types/http.js';
import type { DeleteAccountBody } from '../types/auth.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import { destroyUserSession } from '../utils/session/user-session.js';

export async function deleteAccount(
  req: IncomingRequest<DeleteAccountBody>,
  res: ServerResponse,
) {
  await verifyAuth(req, res);
  const { password } = req.body;

  console.log(password);

  if (!password || typeof password !== 'string' || password.trim() === '') {
    throwApiError(400, {
      code: 'PASSWORD_REQUIRED',
      message: 'Password is required to delete your account.',
      targetInput: 'password',
    });
  }

  const {
    rows: [user],
  } = await pool.query(`SELECT google_id, password FROM users WHERE id=$1`, [
    req.userId,
  ]);

  if (!user) {
    throwApiError(404, {
      code: 'USER_NOT_FOUND',
      message: 'User account not found.',
    });
  }

  if (!user.password) {
    const message = user.google_id
      ? 'Your account was created with Google. Please use Google verification.'
      : 'No password is set for this account. Please reset your password first.';

    throwApiError(400, {
      code: 'NO_PASSWORD_SET',
      message,
      targetInput: 'password',
    });
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throwApiError(401, {
      code: 'INVALID_CREDENTIALS',
      message: 'Incorrect password.',
      targetInput: 'password',
    });
  }

  await destroyUserSession(req, res, 'all');

  await pool.query(
    `
    DELETE FROM users WHERE id=$1
    `,
    [req.userId],
  );

  sendJsonResponse(res, 201, { success: true });
}
