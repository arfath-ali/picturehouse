import { createFeaturedSlider } from "../components/media-featured.js";
import { renderfeatured } from "../features/media-featured.js";
import { initFeaturedScroll } from "../scroll/media-featured.js";
import { getElement } from "../utils/dom.js";
import { createSkeletonFragment } from "../utils/skeleton-structure.js";

export async function initFeatured() {
  const featuredContainer = getElement(".featured");

  featuredContainer.innerHTML = "";

  const fragment = document.createDocumentFragment();

  const { slider, prevBtnContainer, nextBtnContainer } = createFeaturedSlider();

  slider.append(createSkeletonFragment(1, "featured__item-skeleton"));

  slider.innerHTML = "";

  fragment.append(slider, prevBtnContainer, nextBtnContainer);

  featuredContainer.appendChild(fragment);

  await renderfeatured();
  initFeaturedScroll();
}
