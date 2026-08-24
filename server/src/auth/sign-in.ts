import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../types/http.js';
import bcrypt from 'bcrypt';
import type { SignInBody } from '../types/auth.js';
import { throwApiError } from '../http/api-error.js';
import { pool } from '../database/pool.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import { sendEmailVerification } from '../services/mailer.js';
import { createHash, randomInt } from 'node:crypto';
import { createUserSession } from '../utils/session/user-session.js';

export async function signIn(
  req: IncomingRequest<SignInBody>,
  res: ServerResponse,
) {
  const { identifier, password } = req.body;

  if (!identifier) {
    throwApiError(400, {
      code: 'INVALID_IDENTIFIER',
      message: 'Email or Username is required.',
      targetInput: 'identifier',
    });
  }

  if (!password) {
    throwApiError(400, {
      code: 'INVALID_PASSWORD',
      message: 'Password is required.',
      targetInput: 'password',
    });
  }

  const {
    rows: [user],
  } = await pool.query(
    `SELECT id, google_id, avatar_url, email, password, is_verified, otp, otp_expires_at FROM users WHERE username=$1 OR email=$1`,
    [identifier],
  );

  if (!user || !user.password) {
    throwApiError(401, {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email/username or password.',
    });
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throwApiError(401, {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email/username or password.',
    });
  }

  if (!user.is_verified) {
    const previousOtp = user.otp;
    const previousOtpExpiresAt = user.otp_expires_at;

    const otp = randomInt(100000, 1000000).toString();
    const otpHash = createHash('sha256').update(otp).digest('hex');
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    try {
      await pool.query(
        `UPDATE users SET otp=$1, otp_expires_at=$2 WHERE email=$3`,
        [otpHash, otpExpiresAt, user.email],
      );
      await sendEmailVerification(user.email, otp);
    } catch (mailError) {
      await pool.query(
        `UPDATE users SET otp=$1, otp_expires_at=$2 WHERE email=$3`,
        [previousOtp, previousOtpExpiresAt, user.email],
      );
      throw mailError;
    }
  } else {
    await createUserSession(req, res, user.id);
  }

  sendJsonResponse(res, 200, {
    success: true,
    is_verified: user.is_verified,
    user_id: user.id,
    avatar_url: user.avatar_url,
    ...(user.is_verified ? {} : { email: user.email }),
    is_google_user: Boolean(user.google_id),
    has_password: Boolean(user.password),
  });
}
