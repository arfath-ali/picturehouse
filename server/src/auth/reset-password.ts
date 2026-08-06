import type { ServerResponse } from 'node:http';
import bcrypt from 'bcrypt';
import { pool } from '../database/pool.js';
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from '../utils/form-validation.js';
import { createHash } from 'node:crypto';
import { throwApiError } from '../http/api-error.js';
import type { IncomingRequest } from '../types/http.js';
import type { ResetPasswordBody } from '../types/auth.js';
import { sendJsonResponse } from '../http/send-json-response.js';

export async function resetPassword(
  req: IncomingRequest<ResetPasswordBody>,
  res: ServerResponse,
) {
  const { token, email, password, confirmPassword } = req.body;

  const emailValidation = validateEmail(email);

  if (!emailValidation.isValid) {
    throwApiError(400, {
      code: 'INVALID_EMAIL',
      message: emailValidation.message,
      targetInput: 'email',
    });
  }

  const passwordValidation = validatePassword(password);

  if (!passwordValidation.isValid) {
    throwApiError(400, {
      code: 'INVALID_PASSWORD',
      message: passwordValidation.message,
      targetInput: 'password',
    });
  }

  const confirmPasswordValidation = validateConfirmPassword(
    password,
    confirmPassword,
  );

  if (!confirmPasswordValidation.isValid) {
    throwApiError(400, {
      code: 'PASSWORDS_DO_NOT_MATCH',
      message: confirmPasswordValidation.message,
      targetInput: 'confirm-password',
    });
  }

  const userResult = await pool.query(`SELECT id FROM users WHERE email = $1`, [
    email,
  ]);

  const user = userResult.rows[0];

  if (!user) {
    throwApiError(404, {
      code: 'USER_NOT_FOUND',
      message: 'No account found with this email address',
    });
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');

  const {
    rows: [resetRecord],
  } = await pool.query(
    `
    SELECT id, reset_password_link_expires_at
    FROM password_resets
    WHERE user_id = $1 AND reset_password_token = $2
    LIMIT 1
    `,
    [user.id, tokenHash],
  );

  if (!resetRecord) {
    throwApiError(400, {
      code: 'INVALID_RESET_LINK',
      message: 'The password reset link is invalid or has expired.',
    });
  }

  const isExpired =
    new Date(resetRecord.reset_password_link_expires_at) < new Date();

  if (isExpired) {
    await pool.query(
      `
      DELETE FROM password_resets
      WHERE user_id = $1
      `,
      [user.id],
    );

    throwApiError(400, {
      code: 'RESET_LINK_EXPIRED',
      message: 'The password reset link has expired.',
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `
      UPDATE users
      SET password = $1
      WHERE id = $2
      `,
      [hashedPassword, user.id],
    );

    await client.query(
      `
      DELETE FROM password_resets
      WHERE user_id = $1
      `,
      [user.id],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  sendJsonResponse(res, 200, { success: true });
}
