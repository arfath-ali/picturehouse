import type { ServerResponse } from 'node:http';
import type { IncomingRequest } from '../types/http.js';
import { verifyAuth } from '../middlewares/verify-auth.js';
import { v2 as cloudinary } from 'cloudinary';
import busboy from 'busboy';
import { throwApiError } from '../http/api-error.js';
import { sendJsonResponse } from '../http/send-json-response.js';
import { pool } from '../database/pool.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function editAvatar(
  req: IncomingRequest<unknown>,
  res: ServerResponse,
) {
  await verifyAuth(req, res);

  await new Promise<void>((resolve, reject) => {
    const bb = busboy({
      headers: req.headers,
      limits: { fileSize: MAX_FILE_SIZE },
    });
    let fileReceived = false;

    bb.on('file', (fieldname, fileStream, info) => {
      fileReceived = true;
      const { mimeType } = info;

      if (!mimeType.startsWith('image/')) {
        fileStream.resume();
        try {
          throwApiError(400, {
            code: 'INVALID_FILE_TYPE',
            message: 'Uploaded file must be an image.',
            targetInput: 'avatar',
          });
        } catch (err) {
          return reject(err);
        }
      }

      fileStream.on('limit', () => {
        fileStream.resume();
        try {
          throwApiError(400, {
            code: 'FILE_TOO_LARGE',
            message: 'Image size must be less than 5MB.',
            targetInput: 'avatar',
          });
        } catch (err) {
          return reject(err);
        }
      });

      const cloudStream = cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
          ],
        },
        async (error, result) => {
          if (error || !result) {
            try {
              throwApiError(500, {
                code: 'UPLOAD_FAILED',
                message: 'Failed to upload image to Cloudinary.',
              });
            } catch (err) {
              return reject(err);
            }
          }

          try {
            await pool.query(
              `
                UPDATE users
                SET avatar_url=$1
                WHERE id=$2
                `,
              [result.secure_url, req.userId],
            );
            sendJsonResponse(res, 200, {
              success: true,
              avatar_url: result.secure_url,
            });
            resolve();
          } catch (err) {
            return reject(err);
          }
        },
      );

      fileStream.pipe(cloudStream);
    });

    bb.on('close', () => {
      if (!fileReceived && !res.writableEnded) {
        try {
          throwApiError(400, {
            code: 'MISSING_FILE',
            message: 'No file was uploaded.',
            targetInput: 'avatar',
          });
        } catch (err) {
          return reject(err);
        }
      }
    });

    req.pipe(bb);
  });
}
