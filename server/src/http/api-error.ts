import type {
  ApiErrorResponseBody,
  ApiErrorResponse,
} from '../types/errors.js';

export function throwApiError(
  status: number,
  body: ApiErrorResponseBody,
): never {
  const error = new Error(JSON.stringify(body)) as ApiErrorResponse;
  error.status = status;
  error.body = body;

  throw error;
}
