import { createHash } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import { pool } from '../database/pool.js';
import { throwApiError } from '../http/api-error.js';
import type { IncomingRequest } from '../types/http.js';
import type { VerifyEmailBody } from '../types/auth.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import { createUserSession } from '../utils/session/user-session.js';

export async function verifyEmail(
  req: IncomingRequest<VerifyEmailBody>,
  res: ServerResponse,
) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throwApiError(400, {
      code: 'INVALID_INPUT',
      message: 'Email and OTP are required.',
    });
  }

  const otpHash = createHash('sha256').update(otp).digest('hex');

  const {
    rows: [user],
  } = await pool.query(
    `
  SELECT id, is_verified, otp, otp_expires_at
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

  if (new Date(user.otp_expires_at) < new Date()) {
    throwApiError(400, {
      code: 'OTP_EXPIRED',
      message:
        'The verification code has expired. Please click Resend Code to receive a new one.',
    });
  }

  if (user.otp !== otpHash) {
    throwApiError(400, {
      code: 'INVALID_VERIFICATION_CODE',
      message: 'Invalid verification code. Please try again.',
    });
  }

  await pool.query(
    `
    UPDATE users
    SET is_verified=TRUE, otp=NULL, otp_expires_at=NULL
    WHERE email=$1 AND is_verified=FALSE
    `,
    [email],
  );

  await createUserSession(req, res, user.id);

  sendJsonResponse(res, 201, { success: true, user_id: user.id });
}
