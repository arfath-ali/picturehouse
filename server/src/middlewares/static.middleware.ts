import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const mimeTypes: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

export function serveStaticFile(
  req: IncomingMessage,
  res: ServerResponse,
  extension: string,
  __clientdir: string,
) {
  try {
    const staticFileName = path.basename(req.url || '');
    const staticFilePath = path.join(__clientdir, req.url || '');

    const mimeType = mimeTypes[extension];

    if (!mimeType) {
      console.error(
        `❌ No mime type found for ${staticFileName} (${extension})`,
      );
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
      return;
    }

    fs.readFile(staticFilePath, (error, staticFile) => {
      if (error) {
        console.error(`❌ ${staticFileName} not found at: `, staticFilePath);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
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
  } catch (error) {
    console.error('❌ Error serving the static file: ', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
}

export function serveHTMLFile(
  req: IncomingMessage,
  res: ServerResponse,
  __clientdir: string,
) {
  try {
    const htmlFilePath = path.join(__clientdir, 'index.html');

    fs.readFile(htmlFilePath, (error, html) => {
      if (error) {
        console.error('❌ index.html not found at:', htmlFilePath);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
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
  } catch (error) {
    console.error('❌ Error serving the HTML file: ', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
}
