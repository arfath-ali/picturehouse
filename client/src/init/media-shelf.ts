import { createShelf } from "../components/media-shelf.js";
import { shelves } from "../data/shelves.js";
import { renderShelf } from "../features/media-shelf.js";
import { initShelfScroll } from "../scroll/media-shelf.js";
import type { pageCategory } from "../types/page-category.js";
import { getElement } from "../utils/dom.js";
import { createSkeletonFragment } from "../utils/skeleton-structure.js";

export async function initShelves() {
  const currentPage = location.pathname.slice(1) as pageCategory;

  const validPages: pageCategory[] = ["home", "movies", "tv-shows"];

  if (!validPages.includes(currentPage)) return;

  const shelvesContainer = getElement(`.media-shelves-container`);
  shelvesContainer.innerHTML = "";

  const categories = shelves[currentPage];

  if (!categories) {
    console.warn(`No shelf data found for page: ${currentPage}`);
    return;
  }

  const fragment = document.createDocumentFragment();

  categories.forEach((category) => {
    const shelfWrapper = createShelf(category.title, category.identifier);

    const shelfList = shelfWrapper.querySelector<HTMLElement>(
      `.media-shelf__list--${category.identifier}`,
    );

    if (shelfList) {
      shelfList.append(createSkeletonFragment(20, "media-card__skeleton"));
    }

    fragment.appendChild(shelfWrapper);
  });

  shelvesContainer.appendChild(fragment);

  await Promise.all(
    categories.map((category) => renderShelf(category.identifier)),
  );

  initShelfScroll();
}
