import { createHash, randomBytes } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import { pool } from '../database/pool.js';
import { sendResetPasswordLink } from '../services/mailer.js';
import { throwApiError } from '../http/api-error.js';
import type { IncomingRequest } from '../types/http.js';
import type { ForgotPasswordBody } from '../types/auth.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import { validateEmail } from '../utils/form-validation.js';

export async function resendPasswordResetLink(
  req: IncomingRequest<ForgotPasswordBody>,
  res: ServerResponse,
) {
  const { email } = req.body;

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
      targetInput: 'email',
    });
  }

  const rawToken = randomBytes(32).toString('hex');
  const hashedToken = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await pool.query(
    `INSERT INTO password_resets (user_id, reset_password_token, reset_password_link_expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) 
     DO UPDATE SET 
       reset_password_token = EXCLUDED.reset_password_token,
       reset_password_link_expires_at = EXCLUDED.reset_password_link_expires_at`,
    [user.id, hashedToken, expiresAt],
  );

  const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  try {
    await sendResetPasswordLink(email, resetPasswordLink);
  } catch (mailError) {
    throw mailError;
  }

  sendJsonResponse(res, 200, { success: true });
}