export function initWindowScrollManager() {
  const navEntry = window.performance?.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  const isReload = navEntry?.type === "reload";

  if (isReload || !sessionStorage.getItem("app-initialized")) {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("scroll-")) {
        sessionStorage.removeItem(key);
      }
    });

    window.scrollTo(0, 0);

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }

  window.addEventListener("scroll", () => {
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
  });
}
