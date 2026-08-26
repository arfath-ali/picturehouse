import { renderSearch } from "../features/media-search.js";
import { getElement } from "../utils/dom.js";

let searchEventController: AbortController | null = null;
let searchFetchController: AbortController | null = null;

export function initSearchInput() {
  const searchBar = getElement<HTMLFormElement>(".search__bar");
  const searchInput = getElement<HTMLInputElement>(".search__input");
  const searchActionBtn = getElement<HTMLButtonElement>(".search__action-btn");
  const searchMarketingBlock = getElement(".search__marketing");
  const emptyStateContainer = getElement<HTMLElement>(".search__empty-state");
  const searchResultsContainer = getElement<HTMLElement>(".search__results");

  let inputDebounce: ReturnType<typeof setTimeout> | undefined;

  searchEventController?.abort();
  searchEventController = new AbortController();
  const eventSignal = searchEventController.signal;

  searchBar.addEventListener(
    "click",
    () => {
      searchInput.focus();
    },
    { signal: eventSignal },
  );

  searchBar.addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
    },
    { signal: eventSignal },
  );

  searchInput.addEventListener(
    "focus",
    () => {
      emptyStateContainer.classList.remove("is-visible");
    },
    { signal: eventSignal },
  );

  searchInput.addEventListener(
    "input",
    () => {
      if (inputDebounce) clearTimeout(inputDebounce);

      const query = searchInput?.value.trim();

      searchActionBtn.classList.toggle("is-visible", query.length > 0);
      searchMarketingBlock.classList.toggle("is-hidden", query.length > 0);
      emptyStateContainer.classList.remove("is-visible");

      searchResultsContainer.classList.remove("is-visible");
      searchResultsContainer.innerHTML = "";

      if (query.length < 2) {
        searchFetchController?.abort();
        searchFetchController = null;

        searchActionBtn.classList.remove("is-loading");
        searchActionBtn.disabled = false;
        emptyStateContainer.classList.remove("is-visible");
        searchResultsContainer.classList.remove("is-visible");
        searchResultsContainer.innerHTML = "";

        return;
      }

      inputDebounce = setTimeout(async () => {
        searchFetchController?.abort();
        searchFetchController = new AbortController();

        searchActionBtn.classList.add("is-loading");
        searchActionBtn.disabled = true;

        await renderSearch(
          query,
          searchActionBtn,
          emptyStateContainer,
          searchResultsContainer,
          searchFetchController.signal,
        );
      }, 300);
    },
    { signal: eventSignal },
  );

  searchActionBtn.addEventListener(
    "click",
    () => {
      if (searchActionBtn.classList.contains("is-loading")) return;

      searchFetchController?.abort();
      searchFetchController = null;

      searchInput.value = "";
      searchInput.focus();

      searchActionBtn.classList.remove("is-visible");
      searchMarketingBlock.classList.remove("is-hidden");
      emptyStateContainer.classList.remove("is-visible");
      searchResultsContainer.classList.remove("is-visible");
      searchResultsContainer.innerHTML = "";
    },
    { signal: eventSignal },
  );
}

export function cleanupSearchRequest() {
  searchFetchController?.abort();
  searchFetchController = null;

  searchEventController?.abort();
  searchEventController = null;
}
