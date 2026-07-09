import { getElement } from "../utils/dom.js";

export function initHeaderScroll() {
  const header = getElement<HTMLElement>(".site-header");
  let lastScrollY = window.scrollY;
  let isUserInteracting = false;

  window.addEventListener(
    "touchstart",
    () => {
      isUserInteracting = true;
    },
    { passive: true },
  );

  window.addEventListener(
    "mousedown",
    () => {
      isUserInteracting = true;
    },
    { passive: true },
  );

  window.addEventListener(
    "wheel",
    () => {
      isUserInteracting = true;
    },
    { passive: true },
  );

  window.addEventListener(
    "touchend",
    () => {
      isUserInteracting = false;
    },
    { passive: true },
  );

  window.addEventListener(
    "mouseup",
    () => {
      isUserInteracting = false;
    },
    { passive: true },
  );

  window.addEventListener(
    "scroll",
    () => {
      const currentScrollY = window.scrollY;

      const page = document.body.dataset.state;

      const isWatchlistPage =
        page === "watchlist" ||
        page === "watchlist-movies" ||
        page === "watchlist-tv-shows";

      if (isWatchlistPage) {
        const watchlistHeading = getElement(".watchlist__heading");

        if (watchlistHeading) {
          const headerHeight = header.offsetHeight;
          const headingRect = watchlistHeading.getBoundingClientRect();

          header.classList.toggle("is-stuck", headingRect.bottom <= 0);

          const isNotCompletelyBehind = headingRect.bottom > headerHeight;

          watchlistHeading.classList.toggle("is-hidden", isNotCompletelyBehind);
        }

        lastScrollY = currentScrollY;
        return;
      }

      if (currentScrollY > 50) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }

      if (isUserInteracting) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          header.classList.add("is-hidden");
        } else {
          header.classList.remove("is-hidden");
        }
      }

      lastScrollY = currentScrollY;
    },
    { passive: true },
  );
}
