import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import type { ApiErrorResponse } from '../types/errors.js';
import { sendJsonResponse } from './send-json-response.js';

export function asyncHandler<TReq extends IncomingMessage>(
  handler: (req: TReq, res: ServerResponse) => Promise<void>,
): (req: TReq, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('❌ Request handler failed:', error);

      if (res.headersSent) return;

      const appError = error as ApiErrorResponse;

      const status = appError.status ?? 500;

      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');

      if (status >= 400 && status < 500 && appError.body) {
        sendJsonResponse(res, status, appError.body);
      } else {
        sendJsonResponse(res, status, {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error.',
        });
      }
    }
  };
}
