import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { pool } from '../database/pool.js';

export async function checkUsername(req: IncomingMessage, res: ServerResponse) {
  if (!req.params) return;

  const { username } = req.params as any;

  if (!username) return;

  const isUsernameExists = (
    await pool.query(
      `
    SELECT EXISTS(SELECT 1 FROM users WHERE username=$1) AS exists
    `,
      [username],
    )
  ).rows[0].exists;

  console.log(username);

  if (isUsernameExists) {
    const error: any = new Error('Username already taken');
    error.status = 409;
    throw error;
  }

  res.statusCode = 201;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: true }));
}
