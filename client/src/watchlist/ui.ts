import { renderWatchlist } from "./render.js";
import { getWatchlistState } from "./state.js";
import { getElement } from "../utils/dom.js";

export function initWatchlistUI() {
  try {
    const watchlistNav = getElement(".watchlist__nav");
    const watchlistContent = getElement(".watchlist__content");
    const watchlistEmpty = getElement(".watchlist__empty");
    const watchlistMedia = getElement(".watchlist__media");

    const loadingSpinner = document.createElement("div");
    const timeoutId = setTimeout(() => {
      loadingSpinner.classList.add("spinner");
      watchlistContent.appendChild(loadingSpinner);
    }, 500);

    const watchlist = getWatchlistState();

    clearTimeout(timeoutId);
    loadingSpinner.remove();

    if (watchlist.length > 0) {
      watchlistEmpty.classList.remove("is-visible");

      watchlistNav.classList.add("is-visible");
      watchlistMedia.classList.add("is-visible");
      renderWatchlist(watchlist);
    } else {
      watchlistNav.classList.remove("is-visible");
      watchlistMedia.classList.remove("is-visible");
      watchlistEmpty.classList.add("is-visible");
    }
  } catch (error) {
    throw error;
  }
}
