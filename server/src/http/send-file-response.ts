import type { ServerResponse } from 'node:http';

export function sendFileResponse(
  res: ServerResponse,
  status: number,
  file: Buffer | string,
  mimeType: string,
  headers?: Record<string, string>,
): void {
  res.statusCode = status;
  res.setHeader('Content-Type', mimeType);

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }
  }

  res.end(file);
}
