import type { ServerResponse } from 'node:http';
import bcrypt from 'bcrypt';
import { pool } from '../database/pool.js';
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
} from '../utils/form-validation.js';
import { createHash, randomInt } from 'node:crypto';
import { sendEmailVerification } from '../services/mailer.js';
import { throwApiError } from '../http/api-error.js';
import type { IncomingRequest } from '../types/http.js';
import type { SignUpBody } from '../types/auth.js';
import type { ApiErrorResponse } from '../types/errors.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import type { DatabaseError } from 'pg';

export async function signUp(
  req: IncomingRequest<SignUpBody>,
  res: ServerResponse,
) {
  const { username, email, password, confirmPassword } = req.body;

  const usernameValidation = validateUsername(username);

  if (!usernameValidation.isValid) {
    throwApiError(400, {
      code: 'INVALID_USERNAME',
      message: usernameValidation.message,
      targetInput: 'username',
    });
  }

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

  const doesEmailExists = (
    await pool.query(
      `SELECT EXISTS(SELECT 1 FROM users WHERE email=$1) AS exists`,
      [email],
    )
  ).rows[0].exists;

  if (doesEmailExists) {
    throwApiError(409, {
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'Email already exists.',
      targetInput: 'email',
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = randomInt(100000, 1000000).toString();
  const otpHash = createHash('sha256').update(otp).digest('hex');
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    await pool.query(
      `
    INSERT INTO users(username, email, password, otp, otp_expires_at)
    VALUES($1, $2, $3, $4, $5)
    `,
      [username, email, hashedPassword, otpHash, otpExpiresAt],
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

      if (dbError.constraint === 'users_email_key') {
        throwApiError(409, {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email already exists.',
          targetInput: 'email',
        });
      }
    }

    throw error;
  }

  try {
    await sendEmailVerification(email, otp);
  } catch (mailError) {
    try {
      await pool.query(
        `
      DELETE FROM users
      WHERE email = $1
      `,
        [email],
      );
    } catch (deleteError) {
      console.error(
        'User cleanup failed after verification email error:',
        deleteError,
      );
    }
    throw mailError;
  }

  sendJsonResponse(res, 201, { success: true });
}
