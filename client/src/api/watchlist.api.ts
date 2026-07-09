import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import type { MediaPreview } from "../types/media-preview.js";
import type { WatchlistSortPreferenceType } from "../types/watchlist-sort-preference.js";

export async function getWatchlist(signal: AbortSignal) {
  try {
    const response = await fetch(`${API_BASE_URL}/${API_ENDPOINTS.WATCHLIST}`, {
      method: "GET",
      signal,
    });
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
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function addToWatchlist(mediaPayload: MediaPreview) {
  try {
    const response = await fetch(`${API_BASE_URL}/${API_ENDPOINTS.WATCHLIST}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mediaPayload),
    });
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
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function removeFromWatchlist(mediaPayload: MediaPreview) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/${API_ENDPOINTS.WATCHLIST}/${mediaPayload.type}/${mediaPayload.id}`,
      {
        method: "DELETE",
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
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function updateWatchlistSortPreference(
  watchlistSortPreference: WatchlistSortPreferenceType,
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/${API_ENDPOINTS.WATCHLIST}/sort-preference`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(watchlistSortPreference),
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

    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
