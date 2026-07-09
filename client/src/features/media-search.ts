import { getMediaSearch } from "../api/media-search.js";
import { MediaCard } from "../components/media-card.js";
import { setAppState } from "../state/app.js";
import type { MediaPreview } from "../types/media-preview.js";
import { getElement } from "../utils/dom.js";
import { showSearchInlineError } from "../utils/search-inline-error.js";
import { showPageError } from "../utils/show-page-error.js";

let currentSearchPage = 1;

export async function renderSearch(
  query: string,
  searchActionBtn: HTMLElement,
  emptyStateContainer: HTMLElement,
  searchResultsContainer: HTMLElement,
  signal: AbortSignal,
) {
  try {
    const { mediaPayload, totalPages, totalResults } = await getMediaSearch(
      query,
      currentSearchPage,
      signal,
    );
    searchActionBtn.classList.remove("is-loading");

    if (mediaPayload.length === 0) {
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

      mediaPayload.forEach((result: MediaPreview) => {
        searchResultsList.appendChild(MediaCard(result));
      });

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

        loadMoreBtn.addEventListener("click", async () => {
          const existingError = loadMoreContainer.querySelector(
            ".search__results-load-error",
          );
          existingError?.remove();
          loadMoreBtn.disabled = true;
          loadMoreBtn.innerHTML = `LOADING...`;
          loadMoreBtn.classList.add("is-loading");

          try {
            const nextPageData = await getMediaSearch(
              query,
              currentSearchPage,
              signal,
            );

            currentSearchPage++;

            if (nextPageData && Array.isArray(nextPageData.mediaPayload)) {
              nextPageData.mediaPayload.forEach((result: MediaPreview) => {
                searchResultsList.appendChild(MediaCard(result));
              });
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
          } catch (error: any) {
            if (error.name === "AbortError") return;

            if ("status" in error) {
              console.error("Failed to load more media content:", error);

              if (error.status === 404) {
                setAppState("not-found");
                return;
              } else {
                const errorMessage = document.createElement("p");
                errorMessage.classList.add("search__results-load-error");
                errorMessage.textContent =
                  "Couldn't load more results. Please try again.";
                loadMoreContainer.insertBefore(errorMessage, resultsCounter);
              }

              loadMoreBtn.disabled = false;
              loadMoreBtn.classList.remove("is-loading");
              loadMoreBtn.innerHTML = `TRY AGAIN ↓`;
              return;
            }

            console.error(error.message);
            showPageError("search-page");
          }
        });

        loadMoreContainer.append(loadMoreBtn, resultsCounter);
        searchResultsContainer.appendChild(loadMoreContainer);
      }
    }
  } catch (error: any) {
    searchActionBtn.classList.remove("is-loading");
    searchResultsContainer.innerHTML = "";

    if (error.name === "AbortError") return;

    if ("status" in error) {
      console.error("Search failed:", error);
      if (error.status === 404) {
        setAppState("not-found");
        return;
      } else {
        showSearchInlineError();
      }

      return;
    }

    showPageError("search-page");
  }
}
