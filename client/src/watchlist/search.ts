import { renderWatchlist } from "./render.js";
import { getWatchlistState } from "./state.js";
import type { watchlistCategory } from "../types/watchlist-category.js";
import { getElement } from "../utils/dom.js";
import { filterByWatchlistCategory } from "./filter.js";
import { initWatchlistUI } from "./ui.js";

export function initWatchlistSearch() {
  try {
    const searchBar = getElement<HTMLFormElement>(".watchlist__search-bar");
    const searchInput = getElement<HTMLInputElement>(
      ".watchlist__search-input",
    );
    const searchActionBtn = getElement<HTMLButtonElement>(
      ".watchlist__search-action-btn",
    );

    searchInput.value = "";

    searchBar.addEventListener("click", () => {
      searchInput.focus();
    });

    searchInput.addEventListener("input", () => {
      const watchlist = getWatchlistState();

      const query = searchInput?.value.trim().toLowerCase();
      const watchlistCategory = location.pathname.slice(1) as watchlistCategory;

      const categoryWatchlist = filterByWatchlistCategory(
        watchlist,
        watchlistCategory,
      );

      if (categoryWatchlist.length === 0) {
        renderWatchlist(watchlist, false);
        searchActionBtn.classList.toggle("is-visible", false);
        return;
      }

      const filteredWatchlist = watchlist.filter((media) =>
        media.title.toLowerCase().includes(query),
      );

      renderWatchlist(filteredWatchlist, true);

      searchActionBtn.classList.toggle("is-visible", query.length > 0);
    });

    searchActionBtn.addEventListener("click", () => {
      if (searchActionBtn.classList.contains("is-loading")) return;

      searchInput.value = "";
      searchInput.focus();

      initWatchlistUI();
      searchActionBtn.classList.remove("is-visible");
    });
  } catch (error) {
    throw error;
  }
}
