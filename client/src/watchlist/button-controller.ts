import { initWatchlistState, isInWatchlist } from "./state.js";
import type { MediaPreview } from "../types/media-preview.js";
import type { pageCategory } from "../types/page-category.js";
import { getElements } from "../utils/dom.js";
import { setAppState } from "../state/app.js";
import { showNotice } from "../components/show-notice.js";
import { apiRequest } from "../api/api-request.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { API_BASE_URL } from "../config/api.js";
import type {
  AddToWatchlistResponse,
  RemoveFromWatchlistResponse,
} from "../types/api-response.js";
import { isApiError } from "../utils/is-api-error.js";
import { handleSessionExpiration } from "../utils/session-expiration.js";
import { notifyWatchlistChanged } from "../utils/auth-channel.js";

export function updateWatchlistButton(
  mediaId: string | number,
  watchlistState: boolean,
) {
  const page = location.pathname.slice(1) as pageCategory;
  const validPages: pageCategory[] = ["home", "movies", "tv-shows"];

  if (!validPages.includes(page)) return;

  const watchlistBtns = getElements(`[data-tmdb-id="${mediaId}"]`);

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
}

export async function toggleWatchlist(
  watchlistBtn: HTMLElement,
  mediaPayload: MediaPreview,
  watchlistAddIcon?: SVGSVGElement | null,
  watchlistCheckIcon?: SVGSVGElement | null,
  watchlistMediaElement?: HTMLLIElement | null,
  watchlistBtnText?: HTMLElement | null,
) {
  const isUserAuthenticated =
    window.__AUTH_STATE__?.isUserAuthenticated ?? false;

  if (!isUserAuthenticated) {
    showNotice({
      message: "Please sign in to add items to your watchlist.",
      type: "error",
    });
    return;
  }

  watchlistBtn.classList.add("is-loading");

  const isMediaWatchlisted = isInWatchlist(
    String(mediaPayload.id),
    mediaPayload.type,
  );

  const applyLocalUpdates = (watchlistState: boolean) => {
    watchlistAddIcon?.classList.toggle("is-hidden", watchlistState);
    watchlistCheckIcon?.classList.toggle("is-visible", watchlistState);

    if (watchlistBtnText) {
      watchlistBtnText.textContent = watchlistState
        ? "Added to Watchlist"
        : "Add to Watchlist";
    }

    updateWatchlistButton(mediaPayload.id, watchlistState);
  };

  if (isMediaWatchlisted) {
    try {
      const response = await apiRequest<RemoveFromWatchlistResponse>(
        `${API_BASE_URL}/${API_ENDPOINTS.WATCHLIST}/${mediaPayload.type}/${mediaPayload.id}`,
        { method: "DELETE" },
      );

      watchlistBtn.classList.remove("is-loading");

      watchlistMediaElement?.classList.add("is-removed");
      setTimeout(() => {
        watchlistMediaElement?.remove();
      }, 200);

      applyLocalUpdates(response.isWatchlisted);
      notifyWatchlistChanged(mediaPayload.id, response.isWatchlisted);
    } catch (error: unknown) {
      watchlistBtn.classList.remove("is-loading");

      if (isApiError(error) && error.status === 401) {
        handleSessionExpiration();
        return;
      }

      console.error("Watchlist removal failed:", error);

      if (isApiError(error) && error.status === 404) {
        setAppState("not-found");
        return;
      }

      showNotice({
        message: "Couldn't remove from your watchlist. Please try again.",
        type: "error",
      });
    }
  } else {
    try {
      const response = await apiRequest<AddToWatchlistResponse>(
        `${API_BASE_URL}/${API_ENDPOINTS.WATCHLIST}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mediaPayload),
        },
      );
      watchlistBtn.classList.remove("is-loading");

      applyLocalUpdates(response.isWatchlisted);
      notifyWatchlistChanged(mediaPayload.id, response.isWatchlisted);
    } catch (error: unknown) {
      watchlistBtn.classList.remove("is-loading");

      if (isApiError(error) && error.status === 401) {
        handleSessionExpiration();
        return;
      }

      console.error("Search failed:", error);

      if (isApiError(error) && error.status === 404) {
        setAppState("not-found");
        return;
      }

      showNotice({
        message: "Couldn't add to your watchlist. Please try again.",
        type: "error",
      });
    }
  }

  await initWatchlistState();
}
