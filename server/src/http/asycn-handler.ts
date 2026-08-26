import type { ServerResponse, IncomingMessage } from 'node:http';
import { sendJsonResponse } from './send-json-response.js';

export function asyncHandler<TReq extends IncomingMessage>(
  handler: (req: TReq, res: ServerResponse) => Promise<void>,
): (req: TReq, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error('❌ Request handler failed:', error);

      if (res.headersSent) return;

      const status = typeof error?.status === 'number' ? error.status : 500;

      const body = error?.body ?? {
        code: error?.code || 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Internal server error.',
      };

      sendJsonResponse(res, status, body);
    }
  };
}
