import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { pool } from '../database/pool.js';
import { throwApiError } from '../http/api-error.js';
import type { IncomingRequest } from '../types/http.js';
import { sendJsonResponse } from '../http/send-json-response.js';

export async function checkUsername(req: IncomingMessage, res: ServerResponse) {
  const username = req.params?.username;

  if (!username) {
    throwApiError(400, {
      code: 'INVALID_USERNAME',
      message: 'Username is required.',
      targetInput: 'username',
    });
  }

  const isUsernameExists = (
    await pool.query(
      `
    SELECT EXISTS(SELECT 1 FROM users WHERE username=$1) AS exists
    `,
      [username],
    )
  ).rows[0].exists;

  if (isUsernameExists) {
    throwApiError(409, {
      code: 'USERNAME_ALREADY_EXISTS',
      message: 'Username is already taken.',
      targetInput: 'username',
    });
  }

  sendJsonResponse(res, 201, { success: true });
}
