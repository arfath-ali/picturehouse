import http, { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { checkDatabaseConnection } from './database/pool.db.js';
import { syncUsersSchema } from './database/users.db.js';
import { syncAuthTokenSchema } from './database/auth-tokens.db.js';
import { syncWatchlistSchema } from './database/watchlist.db.js';
import {
  serveHTMLFile,
  serveStaticFile,
} from './middlewares/static.middleware.js';

const PORT = process.env.PORT;

const server = http.createServer(
  (req: IncomingMessage, res: ServerResponse) => {
    if (process.env.NODE_ENV === 'production') {
      const origin = req.headers.origin;
      const allowedOrigin = process.env.FRONTEND_URL;

      if (origin && origin === allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    }
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const __clientdir = path.join(__dirname, '..', '..', 'client');

    if (req.url?.startsWith('/api')) {
    } else if (req.url?.includes('.well-known')) {
      res.statusCode = 404;
      res.end();
      return;
    } else {
      const extention = path.extname(req.url || '');

      if (extention) {
        serveStaticFile(req, res, extention, __clientdir);
        return;
      }

      serveHTMLFile(req, res, __clientdir);
      return;
    }
  },
);

server.listen(PORT, async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ CineHub is live at: http://localhost:${PORT}`);
  } else {
    console.log(`✅ CineHub Production Server started on port ${PORT}`);
  }
  await checkDatabaseConnection();
  await syncUsersSchema();
  await syncAuthTokenSchema();
  await syncWatchlistSchema();
});
