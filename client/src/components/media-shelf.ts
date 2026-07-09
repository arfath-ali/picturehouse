/**
 * Creates a shelf for the website
 * @param title - The text shown at the top (e.g., 'Trending Now')
 * @param identifier - Unique class for JS/API targeting (e.g., 'top-rated-films')
 */

import { createIcon } from "../utils/icon.js";

export function createShelf(title: string, identifier: string): HTMLElement {
  const shelfGroup = document.createElement("section");
  const shelfTitle = document.createElement("h2");
  const shelfContainer = document.createElement("div");
  const shelfList = document.createElement("ul");
  const prevBtnContainer = document.createElement("div");
  const prevBtn = document.createElement("button");
  const nextBtnContainer = document.createElement("div");
  const nextBtn = document.createElement("button");

  shelfGroup.classList.add("media-shelf");

  shelfTitle.classList.add("media-shelf__title");
  shelfTitle.textContent = title;

  shelfContainer.classList.add("relative");
  shelfList.classList.add(
    "media-shelf__list",
    `media-shelf__list--${identifier}`,
  );

  prevBtnContainer.classList.add(
    "scroll-container",
    "media-shelf__scroll-container",
    "media-shelf__scroll-container--prev",
    "hidden",
  );

  prevBtn.classList.add(
    "scroll-btn",
    "media-shelf__scroll-btn",
    "media-shelf__scroll-btn--prev",
  );
  prevBtn.setAttribute("aria-label", "Previous slide");
  prevBtn.appendChild(createIcon("icon-arrow-prev", ["scroll-btn__icon"]));

  nextBtnContainer.classList.add(
    "scroll-container",
    "media-shelf__scroll-container",
    "media-shelf__scroll-container--next",
    "hidden",
  );
  nextBtn.classList.add(
    "scroll-btn",
    "media-shelf__scroll-btn",
    "media-shelf__scroll-btn--next",
  );
  nextBtn.setAttribute("aria-label", "Next slide");
  nextBtn.appendChild(createIcon("icon-arrow-next", ["scroll-btn__icon"]));

  prevBtnContainer.appendChild(prevBtn);
  nextBtnContainer.appendChild(nextBtn);

  shelfContainer.append(shelfList, prevBtnContainer, nextBtnContainer);

  shelfGroup.append(shelfTitle, shelfContainer);

  return shelfGroup;
}
