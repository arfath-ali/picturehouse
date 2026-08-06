import type { AppState } from "../types/app-state.js";

const TITLES: Partial<Record<AppState, string>> = {
  "": "Picturehouse",
  home: "Picturehouse | Discover Cinema",
  movies: "Movies | Picturehouse",
  "tv-shows": "TV Shows | Picturehouse",
  details: "Details | Picturehouse",
  search: "Search | Picturehouse",
  watchlist: "My Watchlist | Picturehouse",
  "watchlist-movies": "My Watchlist | Picturehouse",
  "watchlist-tv-shows": "My Watchlist | Picturehouse",
  profile: "My Profile | Picturehouse",
  error: "Picturehouse | Something went wrong",
  "not-found": "Page Not Found | Picturehouse",
};

let loadingInterval: number | null = null;

export function updatePageTitle(
  page: AppState | "error",
  contentTitle?: string | null,
  isLoading: boolean = false,
) {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }

  if (page === "details") {
    if (isLoading) {
      let dotCount = 1;

      document.title = "Details | Loading.";

      loadingInterval = window.setInterval(() => {
        dotCount = (dotCount % 3) + 1;
        const dots = ".".repeat(dotCount);
        document.title = `Details | Loading${dots}`;
      }, 300);
    } else if (contentTitle) {
      document.title = `${contentTitle} | Picturehouse`;
    } else {
      document.title = TITLES[page] ?? "Picturehouse";
    }
  } else {
    document.title = TITLES[page] ?? "Picturehouse";
  }
}
