import { renderDetails } from "../features/media-details.js";
import { setAppState } from "../state/app.js";
import type { AppState } from "../types/app-state.js";
import { initFeatured } from "../init/media-featured.js";
import { initShelves } from "../init/media-shelf.js";
import { initSearchInput } from "../init/search-input.js";
import { initWatchlistSearch } from "../watchlist/search.js";
import { initWatchlistSort } from "../watchlist/sort.js";
import { initWatchlistUI } from "../watchlist/ui.js";
import { getElement } from "../utils/dom.js";
import { initWatchlist } from "../watchlist/init.js";

function restoreVerticalScroll(category: string) {
  const savedVerticalScroll = sessionStorage.getItem(
    `scroll-window-${category}`,
  );

  const targetScrollY = savedVerticalScroll
    ? parseInt(savedVerticalScroll, 10)
    : 0;

  let scrollBehavior: ScrollBehavior = "instant";

  const isWatchlistPage =
    category === "watchlist" ||
    category === "watchlist-movies" ||
    category === "watchlist-tv-shows";

  if (isWatchlistPage) {
    const watchlistHeading = getElement(".watchlist__heading");

    if (watchlistHeading) {
      const isHeadingVisible =
        !watchlistHeading.classList.contains("is-hidden");

      if (isHeadingVisible) {
        scrollBehavior = "smooth";
      }
    }
  }

  window.scrollTo({
    top: targetScrollY,
    left: 0,
    behavior: scrollBehavior,
  });
}
export function navigate() {
  let route = location.pathname.slice(1) as AppState;

  if (route === "") {
    history.replaceState({}, "", "/sign-in");
    route = "sign-in";
  }

  if (route === "discover") {
    history.replaceState({}, "", "/movies");
    route = "movies";
  }

  const isMediaDetailsPage = route.match(/(tv|movie)\/(.+-)?([0-9]+)$/i);

  if (isMediaDetailsPage) {
    const mediaType = isMediaDetailsPage[1];
    const currentTitleSlug = (isMediaDetailsPage[2] || "").replace(/-$/, "");
    const tmdbId = isMediaDetailsPage[3];
    route = "details";
    setAppState("details");
    renderDetails(mediaType, currentTitleSlug, tmdbId);
    return;
  }

  const validAppStates: AppState[] = [
    "sign-in",
    "sign-up",
    "forgot-password",
    "reset-password-email-sent",
    "home",
    "discover",
    "movies",
    "tv-shows",
    "search",
    "watchlist",
    "watchlist-movies",
    "watchlist-tv-shows",
    "profile",
  ];

  if (validAppStates.includes(route)) {
    setAppState(route);

    if (route === "home" || route === "movies" || route === "tv-shows") {
      initFeatured();
      initShelves();
      restoreVerticalScroll(route);
    } else if (route === "search") {
      initSearchInput();
      restoreVerticalScroll(route);
    } else if (
      route === "watchlist" ||
      route === "watchlist-movies" ||
      route === "watchlist-tv-shows"
    ) {
      initWatchlist();
      initWatchlistSort();
      restoreVerticalScroll(route);
    }
  } else setAppState("not-found");
}
