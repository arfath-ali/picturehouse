import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../types/http.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import { destroyUserSession } from '../utils/session/user-session.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import type { SignoutBody } from '../types/auth.js';

export async function signOut(
  req: IncomingRequest<SignoutBody>,
  res: ServerResponse,
) {
  const { signoutType } = req.body;

  await verifyAuth(req, res);

  await destroyUserSession(req, res, signoutType);

  sendJsonResponse(res, 200, {
    success: true,
  });
}
