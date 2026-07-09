import { showPageError } from "../utils/show-page-error.js";
import { initWatchlistSearch } from "./search.js";
import { initWatchlistUI } from "./ui.js";

export function initWatchlist() {
  try {
    initWatchlistUI();
    initWatchlistSearch();
  } catch (error: any) {
    console.log(error.message);
    showPageError("watchlist-page");
  }
}
