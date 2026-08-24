import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { sendJsonResponse } from '../http/send-json-response.js';
import { sendFileResponse } from '../http/send-file-response.js';
import { verifyAuth } from './verify-auth.js';
import type { IncomingRequest } from '../types/http.js';
import { pool } from '../database/pool.js';

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
  req: IncomingRequest<unknown>,
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
    serveHTMLFile(req, res, __clientdir);
    return;
  }

  fs.readFile(staticFilePath, (error, staticFile) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.error(`❌ File not found: ${staticFilePath}`);
        sendJsonResponse(res, 404, {
          code: 'FILE_NOT_FOUND',
          message: 'File not found.',
        });
      } else {
        console.error('❌ Failed to read static file:', error);
        sendJsonResponse(res, 500, {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal Server Error.',
        });
      }

      return;
    }

    const etag = crypto.createHash('md5').update(staticFile).digest('hex');

    if (req.headers['if-none-match'] === etag) {
      sendJsonResponse(res, 304);
      return;
    }

    sendFileResponse(res, 200, staticFile, mimeType, {
      'Cache-Control': 'no-cache',
      ETag: etag,
    });
  });
}

export async function serveHTMLFile(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
  __clientdir: string,
) {
  const htmlFilePath = path.join(__clientdir, 'index.html');
  let isUserAuthenticated = false;
  let avatarURL: string | null = null;
  let isGoogleUser: boolean = false;
  let hasPassword: boolean = false;

  try {
    await verifyAuth(req, res);
    isUserAuthenticated = true;
    const {
      rows: [user],
    } = await pool.query(
      'SELECT google_id, avatar_url, password FROM users WHERE id = $1',
      [req.userId],
    );

    avatarURL = user?.avatar_url ?? null;
    isGoogleUser = Boolean(user?.google_id);
    hasPassword = Boolean(user?.password);
  } catch {
    isUserAuthenticated = false;
  }

  fs.readFile(htmlFilePath, 'utf-8', (error, html) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.error(`❌ HTML File not found: ${htmlFilePath}`);
        sendJsonResponse(res, 404, {
          code: 'FILE_NOT_FOUND',
          message: 'File not found.',
        });
      } else {
        console.error('❌ Failed to read HTML file:', error);
        sendJsonResponse(res, 500, {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal Server Error.',
        });
      }

      return;
    }

    const authState = {
      isUserAuthenticated,
      isGoogleUser,
      hasPassword,
      userId: req.userId || null,
      avatarURL,
    };

    const authScript = `<script>window.__AUTH_STATE__ = ${JSON.stringify(authState)};</script>`;
    const modifiedHtml = html.replace('</head>', `${authScript}</head>`);

    const etag = crypto.createHash('md5').update(modifiedHtml).digest('hex');

    if (req.headers['if-none-match'] === etag) {
      sendJsonResponse(res, 304);
      return;
    }

    sendFileResponse(res, 200, modifiedHtml, 'text/html', {
      'Cache-Control': 'no-cache',
      ETag: etag,
    });
  });
}
