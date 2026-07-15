import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import bcrypt from 'bcrypt';
import { pool } from '../database/pool.js';

export async function signUp(req: IncomingMessage, res: ServerResponse) {
  const userData = req.body as any;

  const isEmailExits = (
    await pool.query(
      `SELECT EXISTS(SELECT 1 FROM users WHERE email=$1) AS exists`,
      [userData.email],
    )
  ).rows[0].exists;

  if (isEmailExits) {
    const error: any = new Error('Email already exists.');
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
