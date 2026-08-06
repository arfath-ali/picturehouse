import { getElement } from "../utils/dom.js";

let headerScrollController: AbortController | null = null;

export function initHeaderScroll() {
  const header = getElement<HTMLElement>(".site-header");

  header.classList.remove("is-hidden", "is-scrolled", "is-stuck");

  let lastScrollY = window.scrollY;
  let isUserInteracting = false;

  if (lastScrollY > 50) {
    header.classList.add("is-scrolled");
  }

  headerScrollController?.abort();
  headerScrollController = new AbortController();
  const signal = headerScrollController.signal;

  window.addEventListener(
    "touchstart",
    () => {
      isUserInteracting = true;
    },
    { signal, passive: true },
  );

  window.addEventListener(
    "mousedown",
    () => {
      isUserInteracting = true;
    },
    { signal, passive: true },
  );

  window.addEventListener(
    "wheel",
    () => {
      isUserInteracting = true;
    },
    { signal, passive: true },
  );

  window.addEventListener(
    "touchend",
    () => {
      isUserInteracting = false;
    },
    { signal, passive: true },
  );

  window.addEventListener(
    "mouseup",
    () => {
      isUserInteracting = false;
    },
    { signal, passive: true },
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
    { signal, passive: true },
  );
}

export function cleanupHeaderScroll() {
  headerScrollController?.abort();
  headerScrollController = null;
}
