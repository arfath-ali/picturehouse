let windowScrollManagerController: AbortController | null = null;

export function clearAllScrollStorage() {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith("scroll-")) {
      sessionStorage.removeItem(key);
    }
  });

  window.scrollTo(0, 0);
}

export function initWindowScrollManager() {
  windowScrollManagerController?.abort();
  windowScrollManagerController = new AbortController();
  const signal = windowScrollManagerController.signal;

  const navEntry = window.performance?.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  const isReload = navEntry?.type === "reload";

  if (isReload || !sessionStorage.getItem("app-initialized")) {
    clearAllScrollStorage();
  }

  window.addEventListener(
    "scroll",
    () => {
      const category = location.pathname.slice(1);
      const validCategories = [
        "home",
        "movies",
        "tv-shows",
        "search",
        "watchlist",
        "watchlist-movies",
        "watchlist-tv-shows",
      ];

      if (validCategories.includes(category)) {
        sessionStorage.setItem(
          `scroll-window-${category}`,
          window.scrollY.toString(),
        );
      }
    },
    { signal },
  );
}

export function cleanupWindowScrollManager() {
  windowScrollManagerController?.abort();
  windowScrollManagerController = null;
}
