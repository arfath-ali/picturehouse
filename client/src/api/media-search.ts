import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";

export async function getMediaSearch(
  query: string,
  searchPage: number,
  signal: AbortSignal,
) {
  const response = await fetch(
    `${API_BASE_URL}/${API_ENDPOINTS.SEARCH(query, searchPage)}`,
    {
      method: "GET",
      signal,
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(
      `${response.status} ${response.statusText}: ${data.error ?? "Unknown error"}`,
    );

    error.status = response.status;
    error.backendMessage = data.error;
    error.statusText = response.statusText;

    throw error;
  }
  return data;
}
