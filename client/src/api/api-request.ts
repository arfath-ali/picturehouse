import { throwApiError } from "./throw-api-error.js";

export async function apiRequest<T>(
  input: RequestInfo,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throwApiError(response, data);
  }

  return data;
}
