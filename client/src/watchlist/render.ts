import { MediaCard } from "../components/media-card.js";
import type { MediaPreview } from "../types/media-preview.js";
import type { watchlistCategory } from "../types/watchlist-category.js";
import { getElement } from "../utils/dom.js";
import { filterByWatchlistCategory } from "./filter.js";

export function renderWatchlist(
  watchlist: MediaPreview[],
  isSearchResult?: boolean,
) {
  const watchlistCategory = location.pathname.slice(1) as watchlistCategory;

  const validWatchlistCategories: watchlistCategory[] = [
    "watchlist",
    "watchlist-movies",
    "watchlist-tv-shows",
  ];

  if (!validWatchlistCategories.includes(watchlistCategory)) return;

  const watchlistMedia = getElement(".watchlist__media");
  const watchlistMediaList = getElement(".watchlist__media-list");

  const fragment = document.createDocumentFragment();
  watchlistMediaList.innerHTML = "";

  const existingFallback = watchlistMedia.querySelector(
    ".watchlist__no-results",
  );
  existingFallback?.remove();

  const filteredWatchlist = filterByWatchlistCategory(
    watchlist,
    watchlistCategory,
  );

  if (filteredWatchlist.length === 0) {
    watchlistMedia.classList.add("has-no-results");

    const noResultsContainer = document.createElement("div");
    noResultsContainer.classList.add("watchlist__no-results");

    const noResultsMessage = document.createElement("p");
    noResultsMessage.classList.add("watchlist__no-results-title");

    if (watchlistCategory === "watchlist") {
      noResultsMessage.textContent = "No Movies or TV shows found";
    } else if (watchlistCategory === "watchlist-movies") {
      noResultsMessage.textContent = isSearchResult
        ? "No Movies found"
        : "No Movies watchlisted";
    } else if (watchlistCategory === "watchlist-tv-shows") {
      noResultsMessage.textContent = isSearchResult
        ? "No TV shows found"
        : "No TV shows watchlisted";
    }

    noResultsContainer.append(noResultsMessage);
    watchlistMedia.append(noResultsContainer);
    return;
  }

  watchlistMedia.classList.remove("has-no-results");

  filteredWatchlist.forEach((media) => {
    fragment.append(MediaCard(media));
  });
  watchlistMediaList.append(fragment);
  watchlistMediaList.classList.remove("is-changing");
}
