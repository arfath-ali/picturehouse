import type { pageCategory } from "../types/page-category.js";
import { getElement } from "../utils/dom.js";

let featuredScrollController: AbortController | null = null;

export function initFeaturedScroll() {
  const page = location.pathname.slice(1) as pageCategory;

  const validPages: pageCategory[] = ["home", "movies", "tv-shows"];

  if (!validPages.includes(page)) return;

  featuredScrollController?.abort();
  featuredScrollController = new AbortController();

  const { signal } = featuredScrollController;

  const featuredSliderContainer = getElement<HTMLElement>(`.featured`);
  const featuredSlider = getElement<HTMLElement>(`.featured__slider`);
  const isFeaturedSkeleton = featuredSlider.querySelector(
    ".featured__item-skeleton",
  );

  if (isFeaturedSkeleton) return;

  if (!featuredSlider || featuredSlider.children.length === 0) return;

  initInfiniteScroll(page, featuredSliderContainer, signal);

  const { startAutoplay, stopAutoplay } = initAutoplay(featuredSlider, signal);

  initWheelNavigation(featuredSlider, signal);

  initNavButtons(
    featuredSliderContainer,
    featuredSlider,
    startAutoplay,
    stopAutoplay,
    signal,
  );
}

function initInfiniteScroll(
  page: string,
  featuredSliderContainer: HTMLElement,
  signal: AbortSignal,
) {
  const slides = Array.from(featuredSliderContainer.children);

  const firstClone = slides[0].cloneNode(true) as HTMLElement;
  const lastClone = slides[slides.length - 1].cloneNode(true) as HTMLElement;

  featuredSliderContainer.appendChild(firstClone);
  featuredSliderContainer.prepend(lastClone);

  featuredSliderContainer.classList.add("no-smooth");

  const savedFeaturedScroll = sessionStorage.getItem(`scroll-featured-${page}`);

  if (savedFeaturedScroll) {
    featuredSliderContainer.scrollLeft = parseInt(savedFeaturedScroll, 10);
  } else {
    featuredSliderContainer.scrollLeft = featuredSliderContainer.clientWidth;
  }

  void featuredSliderContainer.offsetWidth;

  featuredSliderContainer.classList.remove("no-smooth");

  featuredSliderContainer.addEventListener(
    "scroll",
    () => {
      const slideWidth = featuredSliderContainer.clientWidth;
      const scrollPosition = featuredSliderContainer.scrollLeft;
      const totalWidth = featuredSliderContainer.scrollWidth;

      sessionStorage.setItem(
        `scroll-featured-${page}`,
        featuredSliderContainer.scrollLeft.toString(),
      );

      if (scrollPosition >= totalWidth - slideWidth) {
        featuredSliderContainer.classList.add("no-smooth");
        featuredSliderContainer.scrollLeft = slideWidth;
        void featuredSliderContainer.offsetWidth;
        featuredSliderContainer.classList.remove("no-smooth");
      }

      if (scrollPosition <= 0) {
        featuredSliderContainer.classList.add("no-smooth");
        featuredSliderContainer.scrollLeft = totalWidth - 2 * slideWidth;
        void featuredSliderContainer.offsetWidth;
        featuredSliderContainer.classList.remove("no-smooth");
      }
    },
    { signal },
  );
}

function initAutoplay(featuredSlider: HTMLElement, signal: AbortSignal) {
  let autoplayInterval: number;

  const startAutoplay = () => {
    if (autoplayInterval) clearInterval(autoplayInterval);

    autoplayInterval = setInterval(() => {
      featuredSlider.scrollBy({ left: featuredSlider.clientWidth });
    }, 5000);
  };

  const stopAutoplay = () => {
    clearInterval(autoplayInterval);
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange, {
    signal,
  });

  signal.addEventListener("abort", () => {
    stopAutoplay();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  });

  startAutoplay();

  featuredSlider.addEventListener("mouseenter", stopAutoplay, { signal });
  featuredSlider.addEventListener("mouseleave", startAutoplay, { signal });

  featuredSlider.addEventListener("touchstart", stopAutoplay, { signal });
  featuredSlider.addEventListener("touchend", startAutoplay, { signal });

  return { startAutoplay, stopAutoplay };
}

function initWheelNavigation(featuredSlider: HTMLElement, signal: AbortSignal) {
  let isScrolling = false;

  featuredSlider.addEventListener(
    "wheel",
    (e) => {
      if (e.deltaY) return;

      e.preventDefault();

      if (isScrolling) return;

      if (Math.abs(e.deltaX) < 50) return;

      isScrolling = true;

      if (e.deltaX > 0) {
        featuredSlider.scrollBy({
          left: featuredSlider.clientWidth,
        });
      } else if (e.deltaX < 0) {
        featuredSlider.scrollBy({
          left: -featuredSlider.clientWidth,
        });
      }

      setTimeout(() => {
        isScrolling = false;
      }, 400);
    },

    {
      signal,
      passive: false,
    },
  );
}

function initNavButtons(
  featuredSliderContainer: HTMLElement,
  featuredSlider: HTMLElement,
  startAutoplay: () => void,
  stopAutoplay: () => void,
  signal: AbortSignal,
) {
  const scrollPrevBtn = featuredSliderContainer.querySelector(
    ".featured__slider-scroll-btn--prev",
  );
  const scrollNextBtn = featuredSliderContainer.querySelector(
    ".featured__slider-scroll-btn--next",
  );

  if (!scrollPrevBtn || !scrollNextBtn) return;

  scrollPrevBtn.addEventListener("mouseenter", stopAutoplay, { signal });
  scrollPrevBtn.addEventListener("mouseleave", startAutoplay, { signal });

  scrollPrevBtn.addEventListener(
    "click",
    () => {
      featuredSlider.scrollBy({ left: -featuredSlider.clientWidth });
    },
    { signal },
  );

  scrollNextBtn.addEventListener("mouseenter", stopAutoplay, { signal });
  scrollNextBtn.addEventListener("mouseleave", startAutoplay, { signal });

  scrollNextBtn.addEventListener(
    "click",
    () => {
      featuredSlider.scrollBy({ left: featuredSlider.clientWidth });
    },
    { signal },
  );
}
