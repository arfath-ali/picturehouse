import http, { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import { checkDatabaseConnection } from './database/pool.js';
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
import { asyncHandler } from './http/asycn-handler.js';
import { signUp } from './auth/sign-up.js';
import { checkUsername } from './auth/check-username.js';
import { verifyEmail } from './auth/verify-email.js';
import { resendVerificationEmail } from './auth/resend-verification-email.js';
import { registerJobs } from './jobs/register-jobs.js';
import type { IncomingRequest } from './types/http.js';
import type {
  DeleteAccountBody,
  ForgotPasswordBody,
  PasswordResetTokenValidationBody,
  ProfileEmailEditBody,
  ProfileIdentityEditBody,
  ProfilePasswordEditBody,
  ResetPasswordBody,
  SignInBody,
  SignoutBody,
  SignUpBody,
  VerifyEmailBody,
} from './types/auth.js';
import type {
  WatchlistBody,
  watchlistSortPreferenceBody,
} from './types/watchlist.js';
import { sendJsonResponse } from './http/send-json-response.js';
import { signIn } from './auth/sign-in.js';
import { initializeUserSessionsTable } from './database/user_sessions.js';
import { googleAuth } from './google-auth/google-auth.js';
import { googleAuthCallback } from './google-auth/google-auth-callback.js';
import { forgotPassword } from './auth/forgot-password.js';
import { resendPasswordResetLink } from './auth/resend-password-reset-link.js';
import { initializePasswordResetsTable } from './database/password_resets.js';
import { resetPassword } from './auth/reset-password.js';
import { validatePasswordResetToken } from './auth/verify-password-reset-token.js';
import { signOut } from './auth/sign-out.js';
import { getProfile } from './profile/get.js';
import { deleteAccount } from './auth/delete-account.js';
import { editIdentity } from './profile/edit-identity.js';
import { editPassword } from './profile/edit-password.js';
import { editEmail } from './profile/edit-email.js';
import { editAvatar } from './profile/edit-avatar.js';
import { deleteAvatar } from './profile/delete-avatar.js';

const PORT = process.env.PORT;

if (!PORT) throw new Error('PORT environment variable is not defined');

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
      sendJsonResponse(res, 204);
      return;
    }

    if (req.url?.includes('.well-known') || req.url?.includes('devtools')) {
      sendJsonResponse(res, 404);
      return;
    }

    if (req.method === 'GET') {
      if (req.url === '/api/geo/location') {
        asyncHandler(getGeoLocation)(req, res);
        return;
      }

      const pathname = req.url?.split('?')[0];

      if (pathname === '/api/auth/google') {
        asyncHandler(googleAuth)(req, res);
        return;
      }

      if (pathname === '/api/auth/google/callback') {
        googleAuthCallback(req as IncomingRequest<unknown>, res);
        return;
      }

      if (req.url?.startsWith('/api/check-username')) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const username = String(url.searchParams.get('username'));
        req.params = { username };
        asyncHandler(checkUsername)(req, res);
        return;
      }

      if (req.url === '/api/profile') {
        asyncHandler(getProfile)(req as IncomingRequest<unknown>, res);
        return;
      }

      const featuredRegex = /^\/api\/([^/]+)\/featured$/;
      const featuredMatch = req.url?.match(featuredRegex);

      if (
        featuredMatch &&
        VALID_PAGE_CATEGORIES.includes(featuredMatch[1] as pageCategory)
      ) {
        const page = featuredMatch[1] as pageCategory;
        req.params = { page };
        asyncHandler(getMediaFeatured)(req as IncomingRequest<unknown>, res);
        return;
      }

      const mediaShelfRegex = /^\/api\/([^/]+)\/shelf\/([^/]+)$/;
      const mediaShelfMatch = req.url?.match(mediaShelfRegex);

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
        asyncHandler(getMediaShelf)(req as IncomingRequest<unknown>, res);
        return;
      }

      const mediaDetailsRegex = /^\/api\/details\/([^/]+)\/([0-9]+)$/;
      const mediaDetailsMatch = req.url?.match(mediaDetailsRegex);

      if (
        mediaDetailsMatch &&
        VALID_MEDIA_TYPES.includes(mediaDetailsMatch[1] as mediaTypes)
      ) {
        const mediaType = mediaDetailsMatch[1] as mediaTypes;
        const tmdbId = mediaDetailsMatch[2];

        req.params = { mediaType, tmdbId };

        asyncHandler(getMediaDetails)(req as IncomingRequest<unknown>, res);
        return;
      }

      if (req.url?.startsWith('/api/search')) {
        const url = new URL(req.url || '', `http://${req.headers.host}`);

        const query = url.searchParams.get('query');
        const searchPage = url.searchParams.get('searchPage');

        if (!query || !searchPage) {
          sendJsonResponse(res, 400, {
            code: 'MISSING_QUERY_PARAMETERS',
            message: 'Missing query or searchPage parameter.',
          });

          return;
        }
        req.params = { query, searchPage };

        asyncHandler(getMediaSearch)(req, res);
        return;
      }

      if (req.url === '/api/watchlist') {
        asyncHandler(getWatchlist)(req as IncomingRequest<unknown>, res);
        return;
      }

      sendJsonResponse(res, 404, {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found.',
      });
      return;
    } else if (req.method === 'POST') {
      parseRequestBody(
        req as IncomingRequest<Record<string, unknown>>,
        res,
        () => {
          if (req.url === '/api/sign-in') {
            asyncHandler(signIn)(req as IncomingRequest<SignInBody>, res);
            return;
          }
          if (req.url === '/api/sign-out') {
            asyncHandler(signOut)(req as IncomingRequest<SignoutBody>, res);
            return;
          }
          if (req.url === '/api/forgot-password') {
            asyncHandler(forgotPassword)(
              req as IncomingRequest<ForgotPasswordBody>,
              res,
            );
            return;
          }
          if (req.url === '/api/resend-password-reset-link') {
            asyncHandler(resendPasswordResetLink)(
              req as IncomingRequest<ForgotPasswordBody>,
              res,
            );
            return;
          }
          if (req.url === '/api/reset-password/validate') {
            asyncHandler(validatePasswordResetToken)(
              req as IncomingRequest<PasswordResetTokenValidationBody>,
              res,
            );
            return;
          }
          if (req.url === '/api/reset-password') {
            asyncHandler(resetPassword)(
              req as IncomingRequest<ResetPasswordBody>,
              res,
            );
            return;
          }
          if (req.url === '/api/sign-up') {
            asyncHandler(signUp)(req as IncomingRequest<SignUpBody>, res);
            return;
          }
          if (req.url === '/api/verify-email') {
            asyncHandler(verifyEmail)(
              req as IncomingRequest<VerifyEmailBody>,
              res,
            );
            return;
          }
          if (req.url === '/api/resend-verification-email') {
            asyncHandler(resendVerificationEmail)(
              req as IncomingRequest<SignUpBody>,
              res,
            );
            return;
          }
          if (req.url === '/api/profile/identity') {
            asyncHandler(editIdentity)(
              req as IncomingRequest<ProfileIdentityEditBody>,
              res,
            );
            return;
          }

          if (req.url === '/api/profile/email') {
            asyncHandler(editEmail)(
              req as IncomingRequest<ProfileEmailEditBody>,
              res,
            );
            return;
          }
          if (req.url === '/api/profile/password') {
            asyncHandler(editPassword)(
              req as IncomingRequest<ProfilePasswordEditBody>,
              res,
            );
            return;
          }

          if (req.url === '/api/watchlist') {
            asyncHandler(addToWatchlist)(
              req as IncomingRequest<WatchlistBody>,
              res,
            );
            return;
          }

          if (req.url === '/api/delete') {
            asyncHandler(deleteAccount)(
              req as IncomingRequest<DeleteAccountBody>,
              res,
            );
            return;
          }

          sendJsonResponse(res, 404, {
            code: 'ROUTE_NOT_FOUND',
            message: 'Route not found.',
          });
        },
      );
      return;
    } else if (req.method === 'PATCH') {
      parseRequestBody(
        req as IncomingRequest<Record<string, unknown>>,
        res,
        () => {
          if (req.url === '/api/watchlist/sort-preference') {
            asyncHandler(updateWatchlistSortPreference)(
              req as IncomingRequest<watchlistSortPreferenceBody>,
              res,
            );
            return;
          }
          if (req.url === '/api/profile/avatar') {
            asyncHandler(editAvatar)(req as IncomingRequest<unknown>, res);
            return;
          }
          sendJsonResponse(res, 404, {
            code: 'ROUTE_NOT_FOUND',
            message: 'Route not found.',
          });
        },
      );
      return;
    } else if (req.method === 'DELETE') {
      if (req.url?.startsWith('/api/watchlist')) {
        const pathname = new URL(req.url, `http://${req.headers.host}`)
          .pathname;
        const [, , , mediaType, mediaId] = pathname.split('/');

        if (!mediaType || !mediaId) {
          sendJsonResponse(res, 400, {
            code: 'INVALID_URL',
            message: 'Invalid URL.',
          });
          return;
        }

        req.params = { mediaType: mediaType as mediaTypes, mediaId };

        asyncHandler(removeFromWatchlist)(req as IncomingRequest<unknown>, res);
        return;
      }

      if (req.url === '/api/profile/avatar/delete') {
        asyncHandler(deleteAvatar)(req as IncomingRequest<unknown>, res);
        return;
      }
      sendJsonResponse(res, 404, {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found.',
      });
    } else {
      res.setHeader('Allow', 'GET, POST, PATCH, DELETE, OPTIONS');
      sendJsonResponse(res, 405, {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed.',
      });
      return;
    }
  },
);

async function startServer() {
  try {
    await checkDatabaseConnection();
    await initializeUsersTable();
    await initializeUserSessionsTable();
    await initializeWatchlistTable();
    await initializePasswordResetsTable();
    await connectCache();
    registerJobs();

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
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
