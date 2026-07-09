import { addToWatchlist, removeFromWatchlist } from "../api/watchlist.api.js";
import { initWatchlistState, isInWatchlist } from "./state.js";
import type { MediaPreview } from "../types/media-preview.js";
import type { pageCategory } from "../types/page-category.js";
import { getElements } from "../utils/dom.js";
import { setAppState } from "../state/app.js";
import { showNotice } from "../components/show-notice.js";

export async function toggleWatchlist(
  watchlistBtn: HTMLElement,
  mediaPayload: MediaPreview,
  watchlistAddIcon?: SVGSVGElement | null,
  watchlistCheckIcon?: SVGSVGElement | null,
  watchlistMediaElement?: HTMLLIElement | null,
  watchlistBtnText?: HTMLElement | null,
) {
  watchlistBtn.classList.add("is-loading");

  const isMediaWatchlisted = isInWatchlist(
    String(mediaPayload.id),
    mediaPayload.type,
  );

  const updateWatchlistButton = (watchlistState: boolean) => {
    const page = location.pathname.slice(1) as pageCategory;

    const validPages: pageCategory[] = ["home", "movies", "tv-shows"];

    watchlistAddIcon?.classList.toggle("is-hidden", watchlistState);
    watchlistCheckIcon?.classList.toggle("is-visible", watchlistState);

    if (watchlistBtnText)
      watchlistBtnText.textContent = watchlistState
        ? "Added to Watchlist"
        : "Add to Watchlist";

    if (!validPages.includes(page)) return;

    const watchlistBtns = getElements(`[data-tmdb-id="${mediaPayload.id}"]`);

    watchlistBtns.forEach((btn) => {
      btn
        .querySelector(".watchlist-btn__icon-add")
        ?.classList.toggle("is-hidden", watchlistState);
      btn
        .querySelector(".watchlist-btn__icon-check")
        ?.classList.toggle("is-visible", watchlistState);

      const textEl = btn.querySelector(".watchlist-btn__text");
      if (textEl) {
        textEl.textContent = watchlistState
          ? "Added to Watchlist"
          : "Add to Watchlist";
      }
    });
  };

  if (isMediaWatchlisted) {
    try {
      const response = await removeFromWatchlist(mediaPayload);

      watchlistBtn.classList.remove("is-loading");

      watchlistMediaElement?.classList.add("is-removed");
      setTimeout(() => {
        watchlistMediaElement?.remove();
      }, 200);

      updateWatchlistButton(response.isWatchlisted);
    } catch (error: any) {
      watchlistBtn.classList.remove("is-loading");
      if ("status" in error) {
        console.error("Search failed:", error);
        if (error.status === 404) {
          setAppState("not-found");
          return;
        } else {
          showNotice({
            message: "Couldn't remove from your watchlist. Please try again.",
            type: "error",
          });
        }
      }
    }
  } else {
    try {
      const response = await addToWatchlist(mediaPayload);
      watchlistBtn.classList.remove("is-loading");

      updateWatchlistButton(response.isWatchlisted);
    } catch (error: any) {
      if ("status" in error) {
        watchlistBtn.classList.remove("is-loading");
        console.error("Search failed:", error);
        if (error.status === 404) {
          setAppState("not-found");
          return;
        } else {
          showNotice({
            message: "Couldn't add to your watchlist. Please try again.",
            type: "error",
          });
        }
      }
    }
  }

  await initWatchlistState();
}
