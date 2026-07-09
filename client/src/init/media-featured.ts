import { createFeaturedSlider } from "../components/media-featured.js";
import { renderfeatured } from "../features/media-featured.js";
import { initFeaturedScroll } from "../scroll/media-featured.js";
import { getElement } from "../utils/dom.js";

export async function initFeatured() {
  const featuredContainer = getElement(".featured");

  featuredContainer.innerHTML = "";

  const fragment = document.createDocumentFragment();

  const { slider, prevBtnContainer, nextBtnContainer } = createFeaturedSlider();

  fragment.append(slider, prevBtnContainer, nextBtnContainer);

  featuredContainer.appendChild(fragment);

  await renderfeatured();
  initFeaturedScroll();
}
