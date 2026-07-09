import { getElement } from "../utils/dom.js";

export function initCastScroll() {
  const castList = getElement(".media-details__cast-list");

  const scrollPrevContainer = getElement(
    ".media-details__scroll-container--prev",
  );
  const scrollNextContainer = getElement(
    ".media-details__scroll-container--next",
  );

  const scrollPrevBtn = getElement(".media-details__scroll-btn--prev");
  const scrollNextBtn = getElement(".media-details__scroll-btn--next");

  if (
    !castList ||
    !scrollPrevContainer ||
    !scrollNextContainer ||
    !scrollPrevBtn ||
    !scrollNextBtn
  )
    return;

  const gap = parseFloat(getComputedStyle(castList).gap);

  function syncButtons() {
    const scrollLeft = castList.scrollLeft;
    const maxScroll = castList.scrollWidth - castList.clientWidth;

    const threshold = 30;

    scrollPrevContainer.classList.toggle("md:block", scrollLeft > threshold);

    scrollNextContainer.classList.toggle(
      "md:block",
      scrollLeft < maxScroll - threshold,
    );
  }

  const observer = new MutationObserver(() => {
    syncButtons();
  });

  observer.observe(castList, { childList: true });

  scrollPrevBtn.addEventListener("click", () => {
    const cards = [...castList.children] as HTMLElement[];

    const cardWidth = cards[0].offsetWidth + gap;

    const visibleCards = Math.floor(castList.clientWidth / cardWidth);

    const currentIndex = cards.findIndex(
      (card) => card.offsetLeft >= castList.scrollLeft,
    );

    if (currentIndex <= 0) return;

    const targetIndex = Math.max(0, currentIndex - visibleCards);

    castList.scrollTo({
      left: cards[targetIndex].offsetLeft - cardWidth / 2,
    });
  });

  scrollNextBtn.addEventListener("click", () => {
    const cards = [...castList.children] as HTMLElement[];

    const nextCard = cards.find(
      (card) =>
        card.offsetLeft >
        castList.scrollLeft + castList.clientWidth - card.offsetWidth,
    );

    if (!nextCard) return;

    castList.scrollTo({
      left: nextCard.offsetLeft - (nextCard.offsetWidth + gap) / 2,
    });
  });

  castList.addEventListener("scroll", syncButtons);

  syncButtons();
}
