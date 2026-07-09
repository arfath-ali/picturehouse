import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';

export function asyncHandler(
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error('❌ Request handler failed:', error);

      if (res.headersSent) return;

      const status = error.status ?? 500;

      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');

      res.end(
        JSON.stringify({
          error:
            status >= 400 && status < 500
              ? error.message
              : 'Internal Server Error',
        }),
      );
    }
  };
}
