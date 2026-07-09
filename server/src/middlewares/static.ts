import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const mimeTypes: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.map': 'application/json',
  '.ts': 'text/plain',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
};

export function serveStaticFile(
  req: IncomingMessage,
  res: ServerResponse,
  extension: string,
  __clientdir: string,
) {
  const staticFileName = path.basename(req.url || '');
  const staticFilePath = path.join(__clientdir, req.url || '');

  const mimeType = mimeTypes[extension];

  if (!mimeType) {
    console.error(
      `❌ No MIME type configured for ${staticFileName} (${extension})`,
    );

    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Internal Server Error',
      }),
    );
    return;
  }

  fs.readFile(staticFilePath, (error, staticFile) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.error(`❌ File not found: ${staticFilePath}`);
      } else {
        console.error('❌ Failed to read static file:', error);
      }

      res.statusCode = error.code === 'ENOENT' ? 404 : 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error:
            error.code === 'ENOENT'
              ? 'File not found'
              : 'Internal Server Error',
        }),
      );
      return;
    }

    const etag = crypto.createHash('md5').update(staticFile).digest('hex');

    if (req.headers['if-none-match'] === etag) {
      res.statusCode = 304;
      res.end();
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('ETag', etag);
    res.end(staticFile);
  });
}

export function serveHTMLFile(
  req: IncomingMessage,
  res: ServerResponse,
  __clientdir: string,
) {
  const htmlFilePath = path.join(__clientdir, 'index.html');

  fs.readFile(htmlFilePath, (error, html) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.error(`❌ HTML File not found: ${htmlFilePath}`);
      } else {
        console.error('❌ Failed to read HTML file:', error);
      }

      res.statusCode = error.code === 'ENOENT' ? 404 : 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error:
            error.code === 'ENOENT'
              ? 'File not found'
              : 'Internal Server Error',
        }),
      );
      return;
    }

    const etag = crypto.createHash('md5').update(html).digest('hex');

    if (req.headers['if-none-match'] === etag) {
      res.statusCode = 304;
      res.end();
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('ETag', etag);
    res.end(html);
  });
}
