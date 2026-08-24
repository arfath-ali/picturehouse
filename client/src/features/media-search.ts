import { apiRequest } from "../api/api-request.js";
import { mockApiResponse } from "../api/mock-api.js";
import { MediaCard } from "../components/media-card.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { updateShelfCardsFocus } from "../scroll/media-shelf.js";
import { setAppState } from "../state/app.js";
import type { SearchResultsResponse } from "../types/api-response.js";
import type { MediaPreview } from "../types/media-preview.js";
import { getElement } from "../utils/dom.js";
import { isApiError } from "../utils/is-api-error.js";
import { showSearchInlineError } from "../utils/search-inline-error.js";
import { showPageError } from "../utils/show-page-error.js";
import { createSkeletonFragment } from "../utils/skeleton-structure.js";

export async function renderSearch(
  query: string,
  searchActionBtn: HTMLButtonElement,
  emptyStateContainer: HTMLElement,
  searchResultsContainer: HTMLElement,
  signal: AbortSignal,
) {
  let currentSearchPage = 1;

  emptyStateContainer.classList.remove("is-visible");
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

  try {
    const { searchResults, totalPages, totalResults } =
      await apiRequest<SearchResultsResponse>(
        `${API_BASE_URL}/${API_ENDPOINTS.SEARCH(query, currentSearchPage)}`,
        {
          method: "GET",
          signal,
        },
      );

    searchActionBtn.classList.remove("is-loading");
    searchActionBtn.disabled = false;

    if (searchResults.length === 0) {
      searchResultsContainer.classList.remove("is-visible");
      searchResultsContainer.innerHTML = "";

      const emptyQuerySpan = getElement(".search__empty-query");
      emptyStateContainer.classList.add("is-visible");
      emptyQuerySpan.textContent = `"${query}"`;
    } else {
      emptyStateContainer.classList.remove("is-visible");
      searchResultsContainer.innerHTML = "";

      const searchResultsHeading = document.createElement("h2");
      searchResultsHeading.classList.add("search__results-heading");
      searchResultsHeading.textContent = `Results for "${query}"`;

      const searchResultsList = document.createElement("ul");
      searchResultsList.classList.add("search__results-list");
      searchResultsContainer.append(searchResultsHeading, searchResultsList);

      searchResults.forEach((result: MediaPreview) => {
        searchResultsList.appendChild(MediaCard(result, signal));
      });

      updateShelfCardsFocus(searchResultsList);

      if (totalPages > 1) {
        const loadMoreContainer = document.createElement("div");
        loadMoreContainer.classList.add("search__results-load-wrapper");

        const loadMoreBtn = document.createElement("button");
        loadMoreBtn.classList.add(
          "btn",
          "btn--secondary",
          "search__results-load-btn",
        );
        loadMoreBtn.innerHTML = `LOAD MORE CONTENT ↓`;

        const currentlyShownCount = searchResultsList.children.length;

        const resultsCounter = document.createElement("p");
        resultsCounter.classList.add("search__results-counter");
        resultsCounter.textContent = `Viewing ${currentlyShownCount} of ${totalResults} results`;

        loadMoreBtn.addEventListener(
          "click",
          async () => {
            const existingError = loadMoreContainer.querySelector(
              ".search__results-load-error",
            );
            existingError?.remove();
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = `LOADING...`;
            loadMoreBtn.classList.add("is-loading");

            currentSearchPage++;

            try {
              const { searchResults } = await apiRequest<SearchResultsResponse>(
                `${API_BASE_URL}/${API_ENDPOINTS.SEARCH(query, currentSearchPage)}`,
                {
                  method: "GET",
                  signal,
                },
              );

              if (searchResults && Array.isArray(searchResults)) {
                searchResults.forEach((result: MediaPreview) => {
                  searchResultsList.appendChild(MediaCard(result, signal));
                });

                updateShelfCardsFocus(searchResultsList);
              }

              const updatedShownCount = searchResultsList.children.length;
              resultsCounter.textContent = `Viewing ${updatedShownCount} of ${totalResults} results`;

              if (
                currentSearchPage >= totalPages ||
                updatedShownCount >= totalResults
              ) {
                loadMoreContainer.remove();
              } else {
                loadMoreBtn.disabled = false;
                loadMoreBtn.classList.remove("is-loading");
                loadMoreBtn.innerHTML = `LOAD MORE CONTENT ↓`;
              }
            } catch (error: unknown) {
              currentSearchPage--;

              if (error instanceof Error && error.name === "AbortError") {
                return;
              }

              console.error("Failed to load more media content:", error);

              loadMoreBtn.disabled = false;
              loadMoreBtn.classList.remove("is-loading");
              loadMoreBtn.innerHTML = "TRY AGAIN ↓";

              if (isApiError(error)) {
                if (error.status === 404) {
                  setAppState("not-found");
                  return;
                }

                const errorMessage = document.createElement("p");
                errorMessage.classList.add("search__results-load-error");
                errorMessage.textContent =
                  "Couldn't load more results. Please try again.";

                loadMoreContainer.insertBefore(errorMessage, resultsCounter);
                return;
              }

              showPageError("search-page");
            }
          },
          { signal },
        );

        loadMoreContainer.append(loadMoreBtn, resultsCounter);
        searchResultsContainer.appendChild(loadMoreContainer);
      }
    }
  } catch (error: unknown) {
    searchActionBtn.classList.remove("is-loading");
    searchActionBtn.disabled = false;

    searchResultsContainer.classList.remove("is-visible");
    searchResultsContainer.innerHTML = "";

    if (error instanceof Error && error.name === "AbortError") return;

    console.error("Search failed:", error);

    if (isApiError(error)) {
      if (error.status === 404) {
        setAppState("not-found");
        return;
      }

      showSearchInlineError();
    } else {
      showPageError("search-page");
    }
  }
}
