import { getElements } from "../utils/dom.js";

let shelfScrollController: AbortController | null = null;

export function updateShelfCardsFocus(shelfList: HTMLElement) {
  const scrollLeft = shelfList.scrollLeft;
  const clientWidth = shelfList.clientWidth;
  const scrollRight = scrollLeft + clientWidth;

  const cards = Array.from(shelfList.children) as HTMLElement[];

  cards.forEach((card) => {
    const cardLeft = card.offsetLeft;
    const cardRight = cardLeft + card.offsetWidth;

    const isVisible = cardRight > scrollLeft + 5 && cardLeft < scrollRight - 5;

    card.setAttribute("aria-hidden", (!isVisible).toString());

    const focusableElements = card.querySelectorAll<HTMLElement>("a, button");
    focusableElements.forEach((el) => {
      el.setAttribute("tabindex", isVisible ? "0" : "-1");
    });
  });
}

export function initShelfScroll() {
  const shelves = getElements(".media-shelf");

  shelfScrollController?.abort();
  shelfScrollController = new AbortController();
  const signal = shelfScrollController.signal;

  shelves.forEach((shelf) => {
    const shelfList = shelf.querySelector<HTMLElement>(".media-shelf__list");
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

    function syncButtonsAndFocus() {
      const scrollLeft = shelfList!.scrollLeft;
      const maxScroll = shelfList!.scrollWidth - shelfList!.clientWidth;

      const threshold = 30;

      scrollPrevContainer!.classList.toggle("md:block", scrollLeft > threshold);

      scrollNextContainer!.classList.toggle(
        "md:block",
        scrollLeft < maxScroll - threshold,
      );

      updateShelfCardsFocus(shelfList!);
    }

    const observer = new MutationObserver(() => {
      syncButtonsAndFocus();
    });

    observer.observe(shelfList, { childList: true });

    signal.addEventListener("abort", () => {
      observer.disconnect();
    });

    scrollPrevBtn.addEventListener(
      "click",
      () => {
        const cards = [...shelfList.children] as HTMLElement[];

        const gap = parseFloat(getComputedStyle(shelfList).gap) || 0;
        const cardWidth = cards[0].offsetWidth + gap;

        const visibleCards = Math.floor(shelfList.clientWidth / cardWidth);

        const currentIndex = cards.findIndex(
          (card) => card.offsetLeft >= shelfList.scrollLeft,
        );

        if (currentIndex <= 0) return;

        const targetIndex = Math.max(0, currentIndex - visibleCards);

        shelfList.scrollTo({
          left: cards[targetIndex].offsetLeft - cardWidth / 2,
          behavior: "smooth",
        });
      },
      { signal },
    );

    scrollNextBtn.addEventListener(
      "click",
      () => {
        const cards = [...shelfList.children] as HTMLElement[];

        const gap = parseFloat(getComputedStyle(shelfList).gap) || 0;

        const nextCard = cards.find(
          (card) =>
            card.offsetLeft >
            shelfList.scrollLeft + shelfList.clientWidth - card.offsetWidth,
        );

        if (!nextCard) return;

        shelfList.scrollTo({
          left: nextCard.offsetLeft - (nextCard.offsetWidth + gap) / 2,
          behavior: "smooth",
        });
      },
      { signal },
    );

    shelfList.addEventListener("scroll", syncButtonsAndFocus, { signal });

    window.addEventListener(
      "resize",
      () => {
        updateShelfCardsFocus(shelfList);
      },
      { signal },
    );

    syncButtonsAndFocus();
  });
}

export function cleanupShelfScroll() {
  shelfScrollController?.abort();
  shelfScrollController = null;
}
