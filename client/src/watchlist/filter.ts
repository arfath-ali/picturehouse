import type { MediaPreview } from "../types/media-preview.js";
import type { watchlistCategory } from "../types/watchlist-category.js";

export function filterByWatchlistCategory(
  watchlist: MediaPreview[],
  watchlistCategory: watchlistCategory,
): MediaPreview[] {
  return watchlist.filter((media) => {
    if (watchlistCategory === "watchlist") return true;
    return watchlistCategory === "watchlist-movies"
      ? media.type === "movie"
      : media.type === "tv";
  });
}
