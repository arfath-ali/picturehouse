import { createHash, randomInt } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import { pool } from '../database/pool.js';
import { sendEmailVerification } from '../services/mailer.js';
import { throwApiError } from '../http/api-error.js';
import type { IncomingRequest } from '../types/http.js';
import type { ResendVerificationEmailBody } from '../types/auth.js';
import { sendJsonResponse } from '../http/send-json-response.js';

export async function resendVerificationEmail(
  req: IncomingRequest<ResendVerificationEmailBody>,
  res: ServerResponse,
) {
  const { email } = req.body;
  const otp = randomInt(100000, 1000000).toString();
  const otpHash = createHash('sha256').update(otp).digest('hex');
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const {
    rows: [user],
  } = await pool.query(
    `
  SELECT is_verified, otp, otp_expires_at
  FROM users
  WHERE email = $1
  LIMIT 1
  `,
    [email],
  );

  if (!user) {
    throwApiError(400, {
      code: 'VERIFICATION_SESSION_INVALID',
      message: 'Unable to verify the email address.',
    });
  }

  if (user.is_verified) {
    throwApiError(400, {
      code: 'EMAIL_ALREADY_VERIFIED',
      message: 'Email is already verified.',
    });
  }

  const previousOtp = user.otp;
  const previousOtpExpiresAt = user.otp_expires_at;

  const updateResult = await pool.query(
    `
  UPDATE users
  SET otp = $1,
      otp_expires_at = $2
  WHERE email = $3
    AND is_verified = FALSE
  `,
    [otpHash, otpExpiresAt, email],
  );

  if (updateResult.rowCount === 0) {
    throwApiError(400, {
      code: 'VERIFICATION_SESSION_INVALID',
      message: 'Unable to verify the email address.',
    });
  }

  try {
    await sendEmailVerification(email, otp);
  } catch (mailError) {
    try {
      await pool.query(
        `
      UPDATE users
      SET otp = $1,
          otp_expires_at = $2
      WHERE email = $3
      `,
        [previousOtp, previousOtpExpiresAt, email],
      );
    } catch (rollbackError) {
      console.error(
        'Failed to restore previous OTP after email delivery failure:',
        rollbackError,
      );
    }

    throw mailError;
  }

  sendJsonResponse(res, 201, { success: true });
}
