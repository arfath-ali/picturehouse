import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { throwApiError } from '../http/api-error.js';
import { sendJsonResponse } from '../http/send-json-response.js';

export async function googleAuth(req: IncomingMessage, res: ServerResponse) {
  const { GOOGLE_OAUTH_BASE_URL, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } =
    process.env;

  if (!GOOGLE_OAUTH_BASE_URL || !GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    throwApiError(500, {
      code: 'MISSING_OAUTH_CONFIG',
      message: 'Google OAuth credentials are missing on the server.',
    });
  }

  const queryString = req.url?.split('?')[1] ?? '';
  const params = new URLSearchParams(queryString);
  const mode = params.get('mode');

  if (!mode || (mode !== 'signin' && mode !== 'delete')) {
    throwApiError(400, {
      code: 'INVALID_MODE',
      message: 'A valid mode parameter ("signin" or "delete") is required.',
    });
  }

  const googleParams = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: mode,
  });

  const googleConsentURL = `${GOOGLE_OAUTH_BASE_URL}?${googleParams.toString()}`;

  sendJsonResponse(res, 200, { success: true, googleConsentURL });
}
