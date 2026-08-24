import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../types/http.js';
import type { ProfileIdentityEditBody } from '../types/auth.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import { validateUsername } from '../utils/form-validation.js';
import { throwApiError } from '../http/api-error.js';
import { pool } from '../database/pool.js';
import type { DatabaseError } from 'pg';
import { sendJsonResponse } from '../http/send-json-response.js';

export async function editIdentity(
  req: IncomingRequest<ProfileIdentityEditBody>,
  res: ServerResponse,
) {
  await verifyAuth(req, res);

  const { full_name, username } = req.body;
  const refinedFullName = full_name?.trim() ? full_name.trim() : null;

  const {
    rows: [currentUser],
  } = await pool.query(`SELECT full_name, username FROM users WHERE id=$1`, [
    req.userId,
  ]);

  if (!currentUser) {
    throwApiError(404, {
      code: 'USER_NOT_FOUND',
      message: 'User account not found.',
    });
  }

  if (username !== currentUser.username) {
    const usernameValidation = validateUsername(username);

    if (!usernameValidation.isValid) {
      throwApiError(400, {
        code: 'INVALID_USERNAME',
        message: usernameValidation.message,
        targetInput: 'username',
      });
    }

    const isUsernameTaken = (
      await pool.query(`SELECT EXISTS(SELECT 1 FROM users WHERE username=$1)`, [
        username,
      ])
    ).rows[0].exists;

    if (isUsernameTaken) {
      throwApiError(409, {
        code: 'USERNAME_ALREADY_EXISTS',
        message: 'Username is already taken.',
        targetInput: 'username',
      });
    }
  }

  const isFullNameChanged = refinedFullName !== currentUser.full_name;
  const isUsernameChanged = username !== currentUser.username;

  if (!isFullNameChanged && !isUsernameChanged) {
    sendJsonResponse(res, 200, { success: true });
    return;
  }

  try {
    await pool.query(
      `
      UPDATE users
      SET full_name=$1, username=$2
      WHERE id=$3
      `,
      [refinedFullName, username, req.userId],
    );
  } catch (error: unknown) {
    if ((error as DatabaseError).code === '23505') {
      const dbError = error as DatabaseError;
      if (dbError.constraint === 'users_username_key') {
        throwApiError(409, {
          code: 'USERNAME_ALREADY_EXISTS',
          message: 'Username is already taken.',
          targetInput: 'username',
        });
      }
    }

    throw error;
  }

  sendJsonResponse(res, 200, { success: true });
}
