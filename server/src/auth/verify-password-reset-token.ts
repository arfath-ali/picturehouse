import type { ServerResponse } from 'node:http';
import type { PasswordResetTokenValidationBody } from '../types/auth.js';
import type { IncomingRequest } from '../types/http.js';
import { validateEmail } from '../utils/form-validation.js';
import { throwApiError } from '../http/api-error.js';
import { pool } from '../database/pool.js';
import { createHash } from 'node:crypto';
import { sendJsonResponse } from '../http/send-json-response.js';

export async function validatePasswordResetToken(
  req: IncomingRequest<PasswordResetTokenValidationBody>,
  res: ServerResponse,
) {
  const { token, email } = req.body;

  console.log('email:', email);

  const emailValidation = validateEmail(email);

  if (!emailValidation.isValid) {
    throwApiError(400, {
      code: 'INVALID_EMAIL',
      message: emailValidation.message,
      targetInput: 'email',
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

  sendJsonResponse(res, 200, { success: true });
}
