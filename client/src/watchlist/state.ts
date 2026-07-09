import { getWatchlist } from "../api/watchlist.api.js";
import { setAppState } from "../state/app.js";
import type { MediaPreview } from "../types/media-preview.js";
import type { WatchlistSortPreferenceType } from "../types/watchlist-sort-preference.js";
import { showPageError } from "../utils/show-page-error.js";
import { initWatchlistUI } from "./ui.js";

let watchlistController: AbortController | null = null;
let watchlist: MediaPreview[] = [];
let watchlistSet = new Set<string>();
let watchlistSortPreference: WatchlistSortPreferenceType;

export async function initWatchlistState() {
  watchlistController?.abort();
  watchlistController = new AbortController();

  try {
    const signal = watchlistController.signal;
    const response = await getWatchlist(signal);
    watchlist = response.watchlist;
    watchlistSortPreference = response.watchlistSortPreference;

    if (watchlist.length <= 0) {
      initWatchlistUI();
    }

    watchlistSet.clear();

    watchlist.forEach((media) => {
      watchlistSet.add(`${media.id}-${media.type}`);
    });
  } catch (error: any) {
    if (error.name === "AbortError") return;

    throw error;
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
