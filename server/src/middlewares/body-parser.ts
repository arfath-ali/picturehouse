import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../types/http.js';
import { sendJsonResponse } from '../http/send-json-response.js';

export function parseRequestBody(
  req: IncomingRequest<Record<string, unknown>>,
  res: ServerResponse,
  next: () => void,
) {
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('multipart/form-data')) {
    return next();
  }

  let body: string = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      req.body = body ? JSON.parse(body) : {};
      next();
    } catch (error) {
      sendJsonResponse(res, 400, {
        code: 'INVALID_JSON',
        message: 'Invalid JSON format.',
      });
    }
  });
}
