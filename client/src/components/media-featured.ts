/** Create featured slider for the website
 * @param identifier - Unique class for JS/API targeting (e.g., 'featured__slider--home')
 */

import { createIcon } from "../utils/icon.js";

export function createFeaturedSlider() {
  const slider = document.createElement("ul");
  const prevBtnContainer = document.createElement("div");
  const prevBtn = document.createElement("button");
  const nextBtnContainer = document.createElement("div");
  const nextBtn = document.createElement("button");

  slider.classList.add("featured__slider");

  prevBtnContainer.classList.add(
    "scroll-container",
    "featured__slider-scroll-container",
    "featured__slider-scroll-container--prev",
  );

  prevBtn.classList.add(
    "scroll-btn",
    "featured__slider-scroll-btn",
    "featured__slider-scroll-btn--prev",
  );
  prevBtn.setAttribute("aria-label", "Previous slide");
  prevBtn.appendChild(createIcon("icon-arrow-prev", ["scroll-btn__icon"]));

  nextBtnContainer.classList.add(
    "scroll-container",
    "featured__slider-scroll-container",
    "featured__slider-scroll-container--next",
  );
  nextBtn.classList.add(
    "scroll-btn",
    "featured__slider-scroll-btn",
    "featured__slider-scroll-btn--next",
  );
  nextBtn.setAttribute("aria-label", "Next slide");
  nextBtn.appendChild(createIcon("icon-arrow-next", ["scroll-btn__icon"]));

  prevBtnContainer.appendChild(prevBtn);
  nextBtnContainer.appendChild(nextBtn);

  return { slider, prevBtnContainer, nextBtnContainer };
}
