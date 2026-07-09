import { updateWatchlistSortPreference } from "../api/watchlist.api.js";
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

let sortController: AbortController | null = null;

export function initWatchlistSort() {
  try {
    sortController?.abort();
    sortController = new AbortController();
    const { signal } = sortController;

    const watchlistSortPreference = getWatchlistSortPreference();

    const watchlistSortBtn = getElement<HTMLButtonElement>(
      ".watchlist__sort-btn",
    );
    const watchlistSortBtnValue = getElement(".watchlist__sort-value");
    const watchlistSortBtnIcon = getElement<SVGSVGElement>(
      ".watchlist__sort-btn-icon",
    );

    const watchlistSortBtnIconUse = watchlistSortBtnIcon.querySelector("use")!;
    const watchlistSortSelect = getElement(".watchlist__sort-select");
    const watchlistSortSelectOptions = getElements(
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
      async (e) => {
        try {
          const watchlist = getWatchlistState();
          const selectedOption = (e.target as HTMLElement).closest<HTMLElement>(
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
                  Date.parse(b.created_at ?? "") -
                  Date.parse(a.created_at ?? "")
                );
              case "oldest-added":
                return (
                  Date.parse(a.created_at ?? "") -
                  Date.parse(b.created_at ?? "")
                );
              case "title-asc":
                return titleA.localeCompare(titleB);
              case "title-desc":
                return titleB.localeCompare(titleA);
              default:
                return 0;
            }
          });

          await updateWatchlistSortPreference(
            selectedSortValue as WatchlistSortPreferenceType,
          );
          watchlistSortBtn.dataset.value = selectedSortValue;
          watchlistSortBtnValue.textContent = selectedOption.textContent;

          renderWatchlist(sortedList);
          syncActiveOption();
          closeDropdown();

          initWatchlistState();
        } catch (error: any) {
          if (error.name === "AbortError") return;

          if ("status" in error) {
            console.error("Search failed:", error);
            if (error.status === 404) {
              setAppState("not-found");
              return;
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
  } catch (error: any) {}
}
