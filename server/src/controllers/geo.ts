import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { sendJsonResponse } from '../http/send-json-response.js';

export async function getGeoLocation(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const headerValue = req.headers['x-vercel-ip-country'];
  const countryCode = Array.isArray(headerValue)
    ? headerValue[0]
    : headerValue || 'IN';

  sendJsonResponse(res, 200, {
    success: true,
    countryCode: countryCode.toUpperCase(),
  });
}
