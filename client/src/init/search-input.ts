import { renderSearch } from "../features/media-search.js";
import { setAppState } from "../state/app.js";
import { getElement } from "../utils/dom.js";
import { showPageError } from "../utils/show-page-error.js";
import { createSkeletonFragment } from "../utils/skeleton-structure.js";

export function initSearchInput() {
  try {
    const searchBar = getElement<HTMLFormElement>(".search__bar");
    const searchInput = getElement<HTMLInputElement>(".search__input");
    const searchActionBtn = getElement<HTMLButtonElement>(
      ".search__action-btn",
    );
    const searchMarketingBlock = getElement(".search__marketing");
    const emptyStateContainer = getElement<HTMLElement>(".search__empty-state");
    const searchResultsContainer = getElement<HTMLElement>(".search__results");

    let searchAbortController: AbortController | null = null;

    let inputDebounce: ReturnType<typeof setTimeout> | undefined;

    searchBar.addEventListener("click", () => {
      searchInput.focus();
    });

    searchInput.addEventListener("input", () => {
      clearTimeout(inputDebounce);

      const query = searchInput?.value.trim();

      searchActionBtn.classList.toggle("is-visible", query.length > 0);
      searchMarketingBlock.classList.toggle("is-hidden", query.length > 0);
      emptyStateContainer.classList.remove("is-visible");

      if (query.length < 2) {
        clearTimeout(inputDebounce);

        if (searchAbortController) searchAbortController.abort();

        searchActionBtn.classList.remove("is-loading");
        searchResultsContainer.classList.remove("is-visible");
        searchResultsContainer.innerHTML = "";
      }

      if (query.length >= 2) {
        inputDebounce = setTimeout(async () => {
          if (searchAbortController) {
            searchAbortController.abort();
          }

          searchAbortController = new AbortController();

          const { signal } = searchAbortController;

          searchActionBtn.classList.add("is-loading");

          searchResultsContainer.classList.add("is-visible");
          searchResultsContainer.innerHTML = "";

          const width = window.innerWidth;
          let skeletonCount = 4;

          if (width >= 1024 && width < 1440) {
            skeletonCount = 5;
          } else if (width >= 1440) {
            skeletonCount = 7;
          }

          searchResultsContainer.append(
            createSkeletonFragment(skeletonCount, "media-card__skeleton"),
          );

          await renderSearch(
            query,
            searchActionBtn,
            emptyStateContainer,
            searchResultsContainer,
            signal,
          );
        }, 300);
      }
    });

    searchActionBtn.addEventListener("click", () => {
      if (searchActionBtn.classList.contains("is-loading")) return;

      searchInput.value = "";
      searchInput.focus();

      searchActionBtn.classList.remove("is-visible");
      searchMarketingBlock.classList.remove("is-hidden");
      emptyStateContainer.classList.remove("is-visible");
      searchResultsContainer.classList.remove("is-visible");
      searchResultsContainer.innerHTML = "";
    });
  } catch (error: any) {
    console.error(error.message);
    showPageError("search-page");
  }
}
