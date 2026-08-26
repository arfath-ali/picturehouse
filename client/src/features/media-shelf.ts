import { apiRequest } from "../api/api-request.js";
import { MediaCard } from "../components/media-card.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { updateShelfCardsFocus } from "../scroll/media-shelf.js";
import { setAppState } from "../state/app.js";
import type { MediaShelfCollectionResponse } from "../types/api-response.js";
import type { pageCategory } from "../types/page-category.js";
import type { shelfCategoryId } from "../types/shelf-category-id.js";
import type { TMDBContent } from "../types/tmdb-content.js";
import { getElement } from "../utils/dom.js";
import { isApiError } from "../utils/is-api-error.js";
import { showPageError } from "../utils/show-page-error.js";
import { createSkeletonFragment } from "../utils/skeleton-structure.js";

const shelfControllers = new Map<shelfCategoryId, AbortController>();
let shelfCache: Record<string, Record<string, TMDBContent[]>> = {};

export async function renderShelf(identifier: shelfCategoryId) {
  const page = location.pathname.slice(1) as pageCategory;

  const validPages: pageCategory[] = ["home", "movies", "tv-shows"];

  if (!validPages.includes(page)) return;

  const shelfList = getElement<HTMLElement>(
    `.media-shelf__list--${identifier}`,
  );

  shelfControllers.get(identifier)?.abort();

  const controller = new AbortController();
  shelfControllers.set(identifier, controller);

  try {
    let shelfCollection: TMDBContent[] = [];

    if (!shelfCache[page]) {
      shelfCache[page] = {};
    }

    if (shelfCache[page][identifier]) {
      shelfCollection = shelfCache[page][identifier];
    } else {
      const response = await apiRequest<MediaShelfCollectionResponse>(
        `${API_BASE_URL}/${API_ENDPOINTS.SHELF(page, identifier)}`,
        {
          method: "GET",
          signal: controller.signal,
        },
      );
      shelfCollection = response.mediaShelfCollection;
      shelfCache[page][identifier] = shelfCollection;
    }

    if (!shelfCollection || shelfCollection.length === 0) {
      console.error(
        "Failed to load shelf collection: empty or invalid response",
      );
      showPageError("browse-page");
      return;
    }

    shelfList.innerHTML = "";
    const fragment = document.createDocumentFragment();

    shelfCollection.forEach((item: TMDBContent) => {
      fragment.appendChild(MediaCard(item, controller.signal));
    });

    shelfList.appendChild(fragment);

    updateShelfCardsFocus(shelfList);

    shelfList.addEventListener(
      "scroll",
      () => {
        sessionStorage.setItem(
          `scroll-shelf-${page}-${identifier}`,
          shelfList.scrollLeft.toString(),
        );
      },
      { signal: controller.signal },
    );

    const savedHorizontalScroll = sessionStorage.getItem(
      `scroll-shelf-${page}-${identifier}`,
    );

    if (savedHorizontalScroll) {
      shelfList.scrollLeft = parseInt(savedHorizontalScroll, 10);
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") return;
    
    console.error(`Failed to load shelf content for [${identifier}]:`, error);

    if (isApiError(error) && error.status === 404) {
      setAppState("not-found");
      return;
    }
    showPageError("browse-page");
  } finally {
    if (shelfControllers.get(identifier) === controller) {
      shelfControllers.delete(identifier);
    }
  }
}

export function cleanupShelfRequest() {
  for (const controller of shelfControllers.values()) {
    controller.abort();
  }
  shelfControllers.clear();
}
