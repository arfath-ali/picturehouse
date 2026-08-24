import { renderWatchlist } from "./render.js";
import {
  getWatchlistSortPreference,
  getWatchlistState,
  initWatchlistState,
} from "./state.js";
import type { WatchlistSortPreferenceType } from "../types/watchlist-sort-preference.js";
import { getElement, getElements } from "../utils/dom.js";
import { createIcon } from "../utils/icon.js";
import { setAppState } from "../state/app.js";
import { showNotice } from "../components/show-notice.js";
import { showPageError } from "../utils/show-page-error.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { apiRequest } from "../api/api-request.js";
import type { updateWatchlistSortPreferenceResponse } from "../types/api-response.js";
import { isApiError } from "../utils/is-api-error.js";
import { handleSessionExpiration } from "../utils/session-expiration.js";
import { initWatchlistUI } from "./ui.js";

let watchlistSortController: AbortController | null = null;

export function initWatchlistSort() {
  watchlistSortController?.abort();
  watchlistSortController = new AbortController();
  const { signal } = watchlistSortController;

  const watchlistSortPreference = getWatchlistSortPreference();

  const watchlistSortBtn = getElement<HTMLButtonElement>(
    ".watchlist__sort-btn",
  );
  const watchlistSortBtnValue = getElement(".watchlist__sort-value");
  const watchlistSortBtnIcon = getElement<SVGSVGElement>(
    ".watchlist__sort-btn-icon",
  );

  const watchlistSortBtnIconUse = watchlistSortBtnIcon.querySelector("use")!;
  const watchlistSortSelect = getElement<HTMLUListElement>(
    ".watchlist__sort-select",
  );
  const watchlistSortSelectOptions = getElements<HTMLLIElement>(
    ".watchlist__sort-select-option",
  );
  const DROPDOWN_ICONS = {
    up: "icon-dropdown-up",
    down: "icon-dropdown-down",
  };

  const changeSortIcon = (iconId: string) => {
    watchlistSortBtnIcon.classList.add("is-fading");

    setTimeout(() => {
      watchlistSortBtnIconUse.setAttribute("href", `#${iconId}`);
      watchlistSortBtnIcon.classList.toggle(
        "btn__icon--sort",
        iconId === "icon-dropdown-up",
      );
      watchlistSortBtnIcon.classList.remove("is-fading");
    }, 150);
  };

  const syncActiveOption = () => {
    watchlistSortSelectOptions.forEach((option) => {
      option.classList.remove("is-active");
      option.querySelector("svg")?.remove();

      if (option.dataset.value === watchlistSortBtn.dataset.value) {
        option.classList.add("is-active");
        const check = createIcon("icon-sort-check", [
          "btn__icon",
          "btn__icon--sort",
        ]);

        option.append(check);
      }
    });
  };

  const closeDropdown = () => {
    if (!watchlistSortBtn.classList.contains("is-active")) return;

    watchlistSortBtn.classList.remove("is-active");
    watchlistSortSelect.classList.remove("is-clicked");
    changeSortIcon(DROPDOWN_ICONS.down);
  };

  const handleSelectOption = async (target: HTMLElement) => {
    const watchlist = getWatchlistState();
    const selectedOption = target.closest<HTMLElement>(
      ".watchlist__sort-select-option",
    );

    if (!selectedOption) return;

    const selectedSortValue = selectedOption.dataset.value;
    if (!selectedSortValue) return;

    const sortedList = [...watchlist].sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      switch (selectedSortValue) {
        case "recently-added":
          return (
            Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? "")
          );
        case "oldest-added":
          return (
            Date.parse(a.created_at ?? "") - Date.parse(b.created_at ?? "")
          );
        case "title-asc":
          return titleA.localeCompare(titleB);
        case "title-desc":
          return titleB.localeCompare(titleA);
        default:
          return 0;
      }
    });
    try {
      await apiRequest<updateWatchlistSortPreferenceResponse>(
        `${API_BASE_URL}/${API_ENDPOINTS.WATCHLIST}/sort-preference`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            watchlistSortPreference: selectedSortValue,
          }),
        },
      );

      watchlistSortBtn.dataset.value = selectedSortValue;
      watchlistSortBtnValue.textContent = selectedOption.textContent;

      renderWatchlist(sortedList);
      syncActiveOption();
      closeDropdown();

      initWatchlistState();
    } catch (error: any) {
      if (isApiError(error) && error.status === 401) {
        handleSessionExpiration();
        initWatchlistUI();
        return;
      }

      console.error("Search failed:", error);

      if (isApiError(error)) {
        if (error.status === 404) {
          setAppState("not-found");
        } else {
          showNotice({
            message:
              "Couldn't update your watchlist sorting. Please try again.",
            type: "error",
          });
          closeDropdown();
        }

        return;
      }
      showPageError("watchlist-page");
    }
  };

  watchlistSortBtn.addEventListener(
    "click",
    () => {
      const isActive = watchlistSortBtn.classList.toggle("is-active");

      changeSortIcon(isActive ? DROPDOWN_ICONS.up : DROPDOWN_ICONS.down);
      watchlistSortSelect.classList.toggle("is-clicked");
    },
    { signal },
  );

  watchlistSortSelect.addEventListener(
    "click",
    (e) => {
      handleSelectOption(e.target as HTMLElement);
    },
    { signal },
  );

  watchlistSortSelect.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelectOption(e.target as HTMLElement);
      }
    },
    { signal },
  );

  window.addEventListener(
    "click",
    (e) => {
      if ((e.target as HTMLElement).closest(".watchlist__sort")) return;
      closeDropdown();
    },
    { signal },
  );

  const SORT_CLAUSES: Record<WatchlistSortPreferenceType, string> = {
    "recently-added": "Recently Added",
    "oldest-added": "Oldest Added",
    "title-asc": "Title A-Z",
    "title-desc": "Title Z-A",
  };

  watchlistSortBtn.dataset.value = watchlistSortPreference;

  watchlistSortBtnValue.textContent =
    SORT_CLAUSES[watchlistSortPreference] ?? "Recently Added";

  syncActiveOption();
}

export function cleanupWatchlistSort() {
  watchlistSortController?.abort();
  watchlistSortController = null;
}
