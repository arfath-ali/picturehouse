import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../types/http.js';
import bcrypt from 'bcrypt';
import type { ProfilePasswordEditBody } from '../types/auth.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import {
  validateConfirmPassword,
  validatePassword,
} from '../utils/form-validation.js';
import { throwApiError } from '../http/api-error.js';
import { pool } from '../database/pool.js';
import { sendJsonResponse } from '../http/send-json-response.js';

export async function editPassword(
  req: IncomingRequest<ProfilePasswordEditBody>,
  res: ServerResponse,
) {
  await verifyAuth(req, res);

  const { current_password, new_password, confirm_password } = req.body;

  const {
    rows: [currentUser],
  } = await pool.query(`SELECT password FROM users WHERE id=$1`, [req.userId]);

  if (!currentUser) {
    throwApiError(404, {
      code: 'USER_NOT_FOUND',
      message: 'User account not found.',
    });
  }

  if (currentUser.password) {
    if (!current_password) {
      throwApiError(400, {
        code: 'INVALID_PASSWORD',
        message: 'Current password is required.',
        targetInput: 'current-password',
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      current_password,
      currentUser.password,
    );

    if (!isPasswordMatch) {
      throwApiError(400, {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid password.',
        targetInput: 'current-password',
      });
    }
  }

  const newPasswordValidation = validatePassword(new_password);

  if (!newPasswordValidation.isValid) {
    throwApiError(400, {
      code: 'INVALID_PASSWORD',
      message: newPasswordValidation.message,
      targetInput: 'new-password',
    });
  }

  const confirmPasswordValidation = validateConfirmPassword(
    new_password,
    confirm_password,
  );

  if (!confirmPasswordValidation.isValid) {
    throwApiError(400, {
      code: 'PASSWORDS_DO_NOT_MATCH',
      message: confirmPasswordValidation.message,
      targetInput: 'confirm-password',
    });
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);

  await pool.query(
    `
      UPDATE users
      SET password=$1
      WHERE id=$2
      `,
    [hashedPassword, req.userId],
  );

  await pool.query(
    `
    DELETE FROM user_sessions 
    WHERE  user_id=$1 AND id!=$2
    `,
    [req.userId, req.sessionId],
  );

  sendJsonResponse(res, 200, { success: true });
}
