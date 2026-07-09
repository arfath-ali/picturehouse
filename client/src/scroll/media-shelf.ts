import { getElements } from "../utils/dom.js";

export function initShelfScroll() {
  const shelves = getElements(".media-shelf");

  shelves.forEach((shelf) => {
    const shelfList = shelf.querySelector(".media-shelf__list");
    const scrollPrevContainer = shelf.querySelector(
      ".media-shelf__scroll-container--prev",
    );
    const scrollNextContainer = shelf.querySelector(
      ".media-shelf__scroll-container--next",
    );
    const scrollPrevBtn = shelf.querySelector(".media-shelf__scroll-btn--prev");
    const scrollNextBtn = shelf.querySelector(".media-shelf__scroll-btn--next");

    if (
      !shelfList ||
      !scrollPrevContainer ||
      !scrollNextContainer ||
      !scrollPrevBtn ||
      !scrollNextBtn
    )
      return;

    const gap = parseFloat(getComputedStyle(shelfList).gap);

    function syncButtons() {
      const scrollLeft = shelfList!.scrollLeft;
      const maxScroll = shelfList!.scrollWidth - shelfList!.clientWidth;

      const threshold = 30;

      scrollPrevContainer!.classList.toggle("md:block", scrollLeft > threshold);

      scrollNextContainer!.classList.toggle(
        "md:block",
        scrollLeft < maxScroll - threshold,
      );
    }

    const observer = new MutationObserver(() => {
      syncButtons();
    });

    observer.observe(shelfList, { childList: true });

    scrollPrevBtn.addEventListener("click", () => {
      const cards = [...shelfList.children] as HTMLElement[];

      const gap = parseFloat(getComputedStyle(shelfList).gap);
      const cardWidth = cards[0].offsetWidth + gap;

      const visibleCards = Math.floor(shelfList.clientWidth / cardWidth);

      const currentIndex = cards.findIndex(
        (card) => card.offsetLeft >= shelfList.scrollLeft,
      );

      if (currentIndex <= 0) return;

      const targetIndex = Math.max(0, currentIndex - visibleCards);

      shelfList.scrollTo({
        left: cards[targetIndex].offsetLeft - cardWidth / 2,
      });
    });

    scrollNextBtn.addEventListener("click", () => {
      const cards = [...shelfList.children] as HTMLElement[];

      const gap = parseFloat(getComputedStyle(shelfList).gap);

      const nextCard = cards.find(
        (card) =>
          card.offsetLeft >
          shelfList.scrollLeft + shelfList.clientWidth - card.offsetWidth,
      );

      if (!nextCard) return;

      shelfList.scrollTo({
        left: nextCard.offsetLeft - (nextCard.offsetWidth + gap) / 2,
      });
    });

    shelfList.addEventListener("scroll", syncButtons);

    syncButtons();
  });
}
