import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../types/http.js';
import type { ProfileEmailEditBody } from '../types/auth.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import { throwApiError } from '../http/api-error.js';
import { validateEmail } from '../utils/form-validation.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import { pool } from '../database/pool.js';
import { sendEmailVerification } from '../services/mailer.js';
import { createHash, randomInt } from 'node:crypto';

export async function editEmail(
  req: IncomingRequest<ProfileEmailEditBody>,
  res: ServerResponse,
) {
  await verifyAuth(req, res);

  const { email } = req.body;

  const emailValidation = validateEmail(email);

  if (!emailValidation.isValid) {
    throwApiError(400, {
      code: 'INVALID_EMAIL',
      message: emailValidation.message,
      targetInput: 'email',
    });
  }

  const doesEmailExists = (
    await pool.query(
      `SELECT EXISTS(SELECT 1 FROM users WHERE email=$1 AND id!=$2) AS exists`,
      [email, req.userId],
    )
  ).rows[0].exists;

  if (doesEmailExists) {
    throwApiError(409, {
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'Email already exists.',
      targetInput: 'email',
    });
  }

  const otp = randomInt(100000, 1000000).toString();
  const otpHash = createHash('sha256').update(otp).digest('hex');
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await pool.query(
    `
      UPDATE users
      SET otp=$1, otp_expires_at=$2
      WHERE id=$3
      `,
    [otpHash, otpExpiresAt, req.userId],
  );

  await sendEmailVerification(email, otp);

  sendJsonResponse(res, 200, { success: true });
}
