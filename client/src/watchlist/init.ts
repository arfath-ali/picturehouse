import { initWatchlistSearch } from "./search.js";
import { initWatchlistSort } from "./sort.js";
import { initWatchlistUI } from "./ui.js";

export async function initWatchlist() {
  initWatchlistUI();
  initWatchlistSearch();
  initWatchlistSort();
}
