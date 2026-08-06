import type {
  ApiErrorResponse,
  ApiErrorResponseBody,
} from "../types/errors.js";

export function throwApiError(
  response: Response,
  data: ApiErrorResponseBody,
): never {
  const errorMessage = data.message ?? "Unknown error";

  const error = new Error(
    `${response.status} ${response.statusText}: ${errorMessage}`,
  ) as ApiErrorResponse;

  error.status = response.status;
  error.code = data.code;
  error.message = errorMessage;
  error.targetInput = data.targetInput;

  throw error;
}
