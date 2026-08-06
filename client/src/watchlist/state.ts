import { apiRequest } from "../api/api-request.js";
import { mockApiResponse } from "../api/mock-api.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import type { GetWatchlistResponse } from "../types/api-response.js";
import type { MediaPreview } from "../types/media-preview.js";
import type { WatchlistSortPreferenceType } from "../types/watchlist-sort-preference.js";
import { isApiError } from "../utils/is-api-error.js";
import { handleSessionExpiration } from "../utils/session-expiration.js";
import { showPageError } from "../utils/show-page-error.js";
import { initWatchlistUI } from "./ui.js";

let watchlistController: AbortController | null = null;
let watchlist: MediaPreview[] = [];
let watchlistSet = new Set<string>();
let watchlistSortPreference: WatchlistSortPreferenceType;

export async function initWatchlistState() {
  const isUserAuthenticated =
    window.__AUTH_STATE__?.isUserAuthenticated ?? false;

  if (!isUserAuthenticated) {
    watchlist = [];
    watchlistSet.clear();
    initWatchlistUI();
    return;
  }

  watchlistController?.abort();
  watchlistController = new AbortController();

  try {
    const signal = watchlistController.signal;
    const response = await apiRequest<GetWatchlistResponse>(
      `${API_BASE_URL}/${API_ENDPOINTS.WATCHLIST}`,
      {
        method: "GET",
        signal,
      },
    );

    watchlist = response.watchlist;
    watchlistSortPreference = response.watchlistSortPreference;

    if (watchlist.length <= 0) {
      initWatchlistUI();
    }

    watchlistSet.clear();

    watchlist.forEach((media) => {
      watchlistSet.add(`${media.id}-${media.type}`);
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") return;

    if (isApiError(error) && error.status === 401) {
      handleSessionExpiration();
      watchlist = [];
      watchlistSet.clear();
      initWatchlistUI();
      return;
    }

    console.error(error);
    showPageError("watchlist-page");
  } finally {
    watchlistController = null;
  }
}

export function getWatchlistState() {
  return watchlist;
}

export function isInWatchlist(id: string, type: string) {
  return watchlistSet.has(`${id}-${type}`);
}

export function getWatchlistSortPreference() {
  return watchlistSortPreference;
}

export function cleanupWatchlistState() {
  watchlistController?.abort();
  watchlistController = null;
}
