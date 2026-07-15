import http, { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import { checkDatabaseConnection } from './database/pool.js';
import { serveHTMLFile, serveStaticFile } from './middlewares/static.js';
import { getMediaFeatured } from './media/featured.js';
import {
  VALID_MEDIA_SHELF_CATEGORIES,
  type mediaShelfCategory,
} from './constants/media-shelf-categories.js';
import { getMediaShelf } from './media/media-shelf.js';
import { connectCache } from './cache/redis.js';
import {
  VALID_PAGE_CATEGORIES,
  type pageCategory,
} from './constants/page-categories.js';
import { VALID_MEDIA_TYPES, type mediaTypes } from './constants/media-types.js';
import { getMediaDetails } from './media/details.js';
import { getGeoLocation } from './controllers/geo.js';
import { getMediaSearch } from './media/search.js';
import { addToWatchlist } from './watchlist/add.js';
import { parseRequestBody } from './middlewares/body-parser.js';
import { initializeWatchlistTable } from './database/wacthlist.js';
import { getWatchlist } from './watchlist/get.js';
import { removeFromWatchlist } from './watchlist/remove.js';
import { initializeUsersTable } from './database/users.js';
import { updateWatchlistSortPreference } from './watchlist/update-sort-preference.js';
import { asyncHandler } from './middlewares/asycn-handler.js';
import { signUp } from './auth/sign-up.js';

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

    if (req.url?.includes('.well-known') || req.url?.includes('devtools')) {
      res.statusCode = 404;
      res.end();
      return;
    }

    if (!req.url?.startsWith('/api')) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const __clientdir = path.join(__dirname, '..', '..', 'client');
      const extention = path.extname(req.url || '');

      if (extention) {
        serveStaticFile(req, res, extention, __clientdir);
        return;
      }

      serveHTMLFile(req, res, __clientdir);
      return;
    } else if (req.url?.startsWith('/api')) {
      if (req.method === 'GET') {
        if (req.url === '/api/geo/location') {
          asyncHandler(getGeoLocation)(req, res);
          return;
        }

        const featuredRegex = /^\/api\/([^/]+)\/featured$/;
        const featuredMatch = req.url.match(featuredRegex);

        if (
          featuredMatch &&
          VALID_PAGE_CATEGORIES.includes(featuredMatch[1] as pageCategory)
        ) {
          const page = featuredMatch[1] as pageCategory;
          req.params = { page };
          asyncHandler(getMediaFeatured)(req, res);
          return;
        }

        const mediaShelfRegex = /^\/api\/([^/]+)\/shelf\/([^/]+)$/;
        const mediaShelfMatch = req.url.match(mediaShelfRegex);

        if (
          mediaShelfMatch &&
          VALID_PAGE_CATEGORIES.includes(mediaShelfMatch[1] as pageCategory) &&
          VALID_MEDIA_SHELF_CATEGORIES.includes(
            mediaShelfMatch[2] as mediaShelfCategory,
          )
        ) {
          const page = mediaShelfMatch[1] as pageCategory;
          const mediaShelf = mediaShelfMatch[2] as mediaShelfCategory;

          req.params = { page, mediaShelf };
          asyncHandler(getMediaShelf)(req, res);
          return;
        }

        const mediaDetailsRegex = /^\/api\/details\/([^/]+)\/([0-9]+)$/;
        const mediaDetailsMatch = req.url.match(mediaDetailsRegex);

        if (
          mediaDetailsMatch &&
          VALID_MEDIA_TYPES.includes(mediaDetailsMatch[1] as mediaTypes)
        ) {
          const mediaType = mediaDetailsMatch[1] as mediaTypes;
          const tmdbId = mediaDetailsMatch[2];

          req.params = { mediaType, tmdbId };

          asyncHandler(getMediaDetails)(req, res);
          return;
        }

        const url = new URL(req.url || '', `http://${req.headers.host}`);

        if (req.url.startsWith('/api/search')) {
          const query = url.searchParams.get('query');
          const searchPage = url.searchParams.get('searchPage');

          if (!query || !searchPage) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                error: 'Missing query or searchPage parameter',
              }),
            );
            return;
          }

          req.params = { query, searchPage };

          asyncHandler(getMediaSearch)(req, res);
          return;
        }

        if (req.url === '/api/watchlist') {
          asyncHandler(getWatchlist)(req, res);
          return;
        }

        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Route not found' }));
      } else if (req.method === 'POST') {
        parseRequestBody(req, res, () => {
          if (req.url === '/api/sign-up') {
            asyncHandler(signUp)(req, res);
            return;
          }
          if (req.url === '/api/watchlist') {
            asyncHandler(addToWatchlist)(req, res);
            return;
          }
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Route not found' }));
        });
        return;
      } else if (req.method === 'PATCH') {
        parseRequestBody(req, res, () => {
          if (req.url === '/api/watchlist/sort-preference') {
            asyncHandler(updateWatchlistSortPreference)(req, res);
            return;
          }
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Route not found' }));
        });
        return;
      } else if (req.method === 'DELETE') {
        if (req.url.startsWith('/api/watchlist')) {
          const pathname = new URL(req.url, `http://${req.headers.host}`)
            .pathname;
          const [, , , mediaType, mediaId] = pathname.split('/');

          if (!mediaType || !mediaId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                error: `Incorrect URL: ${req.url}`,
              }),
            );
            return;
          }

          req.params = { mediaType: mediaType as mediaTypes, mediaId };

          asyncHandler(removeFromWatchlist)(req, res);
          return;
        }
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Route not found' }));
      } else {
        res.statusCode = 405;
        res.setHeader('Allow', 'GET, POST, PATCH, DELETE, OPTIONS');
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Method Not Allowed',
          }),
        );
      }
    }
  },
);

async function startServer() {
  try {
    await checkDatabaseConnection();
    await initializeUsersTable();
    await initializeWatchlistTable();
    await connectCache();

    server.on('error', (error) => {
      console.error('❌ Server failed to start:', error);
      process.exit(1);
    });

    server.listen(PORT, () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Picturehouse is live at: http://localhost:${PORT}`);
      } else {
        console.log(
          `✅ Picturehouse Production Server started on port ${PORT}`,
        );
      }
    });
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

startServer();
