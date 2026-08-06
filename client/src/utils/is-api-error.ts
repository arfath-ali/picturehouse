import type { ApiErrorResponse } from "../types/errors.js";

export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number"
  );
}
