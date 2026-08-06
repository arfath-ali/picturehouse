import type { ServerResponse } from 'node:http';

export function sendJsonResponse(
  res: ServerResponse,
  status: number,
  body?: unknown,
): void {
  res.statusCode = status;

  if (body === undefined) {
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}
