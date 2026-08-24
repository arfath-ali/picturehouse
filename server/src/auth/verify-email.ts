import { createHash } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import { pool } from '../database/pool.js';
import { throwApiError } from '../http/api-error.js';
import type { IncomingRequest } from '../types/http.js';
import type { VerifyEmailBody } from '../types/auth.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import { createUserSession } from '../utils/session/user-session.js';
import { verifyAuth } from '../middlewares/verify-auth.js';

export async function verifyEmail(
  req: IncomingRequest<VerifyEmailBody>,
  res: ServerResponse,
) {
  const { email, otp, source } = req.body;

  if (!email || !otp) {
    throwApiError(400, {
      code: 'INVALID_INPUT',
      message: 'Email and OTP are required.',
    });
  }

  if (source === 'profile') {
    await verifyAuth(req, res);
  }

  const otpHash = createHash('sha256').update(otp).digest('hex');

  const isProfileEdit = source === 'profile';

  const query = isProfileEdit
    ? `
      SELECT id, google_id, avatar_url, password, is_verified, otp, otp_expires_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `
    : `
      SELECT id, google_id, avatar_url, password, is_verified, otp, otp_expires_at
      FROM users
      WHERE email = $1
      LIMIT 1
      `;

  const queryParam = isProfileEdit ? req.userId : email;

  const {
    rows: [user],
  } = await pool.query(query, [queryParam]);

  if (!user) {
    throwApiError(400, {
      code: 'VERIFICATION_SESSION_INVALID',
      message: 'Unable to verify the email address.',
    });
  }

  if (!isProfileEdit) {
    if (user.is_verified) {
      throwApiError(400, {
        code: 'EMAIL_ALREADY_VERIFIED',
        message: 'Email is already verified.',
      });
    }
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
    SET email=$1, is_verified=TRUE, otp=NULL, otp_expires_at=NULL, google_id = CASE WHEN $3 = TRUE THEN NULL ELSE google_id END
    WHERE id=$2
    `,
    [email, user.id, isProfileEdit],
  );

  if (source === 'profile') {
    await pool.query(
      `
    DELETE FROM user_sessions 
    WHERE  user_id=$1 AND id!=$2
    `,
      [req.userId, req.sessionId],
    );
  } else {
    await createUserSession(req, res, user.id);
  }

  sendJsonResponse(res, 201, {
    success: true,
    user_id: user.id,
    avatar_url: user.avatar_url,
    is_google_user: Boolean(user.google_id),
    has_password: Boolean(user.password),
  });
}
