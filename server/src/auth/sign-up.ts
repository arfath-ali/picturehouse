import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import bcrypt from 'bcrypt';
import { pool } from '../database/pool.js';
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
} from '../utils/form-validation.js';

export async function signUp(req: IncomingMessage, res: ServerResponse) {
  const userData = req.body as any;

  const usernameValidation = validateUsername(userData.username);

  if (!usernameValidation.isValid) {
    const error: any = new Error(
      JSON.stringify({
        field: 'username',
        message: usernameValidation.message,
      }),
    );
    error.status = 409;
    throw error;
  }

  const emailValidation = validateEmail(userData.email);

  if (!emailValidation.isValid) {
    const error: any = new Error(
      JSON.stringify({
        field: 'email',
        message: emailValidation.message,
      }),
    );
    error.status = 409;
    throw error;
  }

  const passwordValidation = validatePassword(userData.password);

  if (!passwordValidation.isValid) {
    const error: any = new Error(
      JSON.stringify({
        field: 'password',
        message: passwordValidation.message,
      }),
    );
    error.status = 409;
    throw error;
  }

  const confirmPasswordValidation = validateConfirmPassword(
    userData.password,
    userData.confirmPassword,
  );

  if (!confirmPasswordValidation.isValid) {
    const error: any = new Error(
      JSON.stringify({
        field: 'confirm-password',
        message: confirmPasswordValidation.message,
      }),
    );
    error.status = 409;
    throw error;
  }

  const isUsernameTaken = (
    await pool.query(`SELECT EXISTS(SELECT 1 FROM users WHERE username=$1)`, [
      userData.username,
    ])
  ).rows[0].exists;

  if (isUsernameTaken) {
    const error: any = new Error(
      JSON.stringify({
        field: 'username',
        message: 'Username is already taken.',
      }),
    );
    error.status = 409;
    throw error;
  }

  const isEmailExits = (
    await pool.query(
      `SELECT EXISTS(SELECT 1 FROM users WHERE email=$1) AS exists`,
      [userData.email],
    )
  ).rows[0].exists;

  if (isEmailExits) {
    const error: any = new Error(
      JSON.stringify({ field: 'email', message: 'Email already exists.' }),
    );
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  await pool.query(
    `
    INSERT into users(username, email, password)
    VALUES($1, $2, $3)
    `,
    [userData.username, userData.email, hashedPassword],
  );

  res.statusCode = 201;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: true }));
}
