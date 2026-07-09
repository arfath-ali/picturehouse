import { getMediaShelf } from "../api/media-shelf.js";
import { MediaCard } from "../components/media-card.js";
import { setAppState } from "../state/app.js";
import type { pageCategory } from "../types/page-category.js";
import type { shelfCategoryId } from "../types/shelf-category-id.js";
import type { TMDBContent } from "../types/tmdb-content.js";
import { getElement } from "../utils/dom.js";
import { showPageError } from "../utils/show-page-error.js";
import { createSkeletonFragment } from "../utils/skeleton-structure.js";

let shelfCache: Record<string, Record<string, TMDBContent[]>> = {};

export async function renderShelf(identifier: shelfCategoryId) {
  const page = location.pathname.slice(1) as pageCategory;

  const validPages: pageCategory[] = ["home", "movies", "tv-shows"];

  if (!validPages.includes(page)) return;

  const shelfList = getElement(`.media-shelf__list--${identifier}`);
  shelfList.innerHTML = "";

  shelfList.append(createSkeletonFragment(20, "media-card__skeleton"));

  try {
    let shelfCollection: TMDBContent[] = [];

    if (!shelfCache[page]) {
      shelfCache[page] = {};
    }

    if (shelfCache[page][identifier]) {
      shelfCollection = shelfCache[page][identifier];
    } else {
      shelfCollection = await getMediaShelf(page, identifier);
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
      fragment.appendChild(MediaCard(item));
    });

    shelfList.appendChild(fragment);

    shelfList.addEventListener("scroll", () => {
      sessionStorage.setItem(
        `scroll-shelf-${page}-${identifier}`,
        shelfList.scrollLeft.toString(),
      );
    });

    const savedHorizontalScroll = sessionStorage.getItem(
      `scroll-shelf-${page}-${identifier}`,
    );

    if (savedHorizontalScroll) {
      shelfList.scrollLeft = parseInt(savedHorizontalScroll, 10);
    }
  } catch (error: any) {
    console.error(`Failed to load shelf content for [${identifier}]:`, error);
    if (error.status >= 500) {
      showPageError("browse-page");
    } else if (error.status === 404) {
      setAppState("not-found");
    } else {
      showPageError("browse-page");
    }
  }
  return;
}
