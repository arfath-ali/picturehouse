import type { pageCategory } from "../types/page-category.js";
import { getElement } from "../utils/dom.js";

let featuredScrollController: AbortController | null = null;

export function initFeaturedScroll() {
  featuredScrollController?.abort();
  featuredScrollController = new AbortController();

  const { signal } = featuredScrollController;

  const page = location.pathname.slice(1) as pageCategory;

  const validPages: pageCategory[] = ["home", "movies", "tv-shows"];

  if (!validPages.includes(page)) return;

  const featuredSliderContainer = getElement<HTMLElement>(`.featured`);
  const featuredSlider = getElement<HTMLElement>(`.featured__slider`);
  const isFeaturedSkeleton = featuredSlider.querySelector(
    ".featured__item-skeleton",
  );

  if (isFeaturedSkeleton) return;

  if (!featuredSlider || featuredSlider.children.length === 0) return;

  initInfiniteScroll(page, featuredSlider, signal);

  const { startAutoplay, stopAutoplay } = initAutoplay(featuredSlider, signal);

  initWheelNavigation(featuredSlider, signal);

  initNavButtons(
    featuredSliderContainer,
    featuredSlider,
    startAutoplay,
    stopAutoplay,
    signal,
  );

  window.addEventListener(
    "resize",
    () => {
      updateFeaturedSlideFocus(featuredSlider);
    },
    { signal },
  );
}

function initInfiniteScroll(
  page: string,
  featuredSlider: HTMLElement,
  signal: AbortSignal,
) {
  const slides = Array.from(featuredSlider.children);

  const firstClone = slides[0].cloneNode(true) as HTMLElement;
  const lastClone = slides[slides.length - 1].cloneNode(true) as HTMLElement;

  featuredSlider.appendChild(firstClone);
  featuredSlider.prepend(lastClone);

  featuredSlider.classList.add("no-smooth");

  const savedFeaturedScroll = sessionStorage.getItem(`scroll-featured-${page}`);

  if (savedFeaturedScroll) {
    featuredSlider.scrollLeft = parseInt(savedFeaturedScroll, 10);
  } else {
    featuredSlider.scrollLeft = featuredSlider.clientWidth;
  }

  void featuredSlider.offsetWidth;

  featuredSlider.classList.remove("no-smooth");

  updateFeaturedSlideFocus(featuredSlider);

  featuredSlider.addEventListener(
    "scroll",
    () => {
      const slideWidth = featuredSlider.clientWidth;
      const scrollPosition = featuredSlider.scrollLeft;
      const totalWidth = featuredSlider.scrollWidth;

      sessionStorage.setItem(
        `scroll-featured-${page}`,
        featuredSlider.scrollLeft.toString(),
      );

      if (scrollPosition >= totalWidth - slideWidth) {
        featuredSlider.classList.add("no-smooth");
        featuredSlider.scrollLeft = slideWidth;
        void featuredSlider.offsetWidth;
        featuredSlider.classList.remove("no-smooth");
      }

      if (scrollPosition <= 0) {
        featuredSlider.classList.add("no-smooth");
        featuredSlider.scrollLeft = totalWidth - 2 * slideWidth;
        void featuredSlider.offsetWidth;
        featuredSlider.classList.remove("no-smooth");
      }

      updateFeaturedSlideFocus(featuredSlider);
    },
    { signal },
  );
}

function initAutoplay(featuredSlider: HTMLElement, signal: AbortSignal) {
  let autoplayInterval: number | null = null;

  const startAutoplay = () => {
    if (autoplayInterval) clearInterval(autoplayInterval);

    autoplayInterval = window.setInterval(() => {
      featuredSlider.scrollBy({ left: featuredSlider.clientWidth });
    }, 5000);
  };

  const stopAutoplay = () => {
    if (autoplayInterval !== null) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
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

  signal.addEventListener(
    "abort",
    () => {
      stopAutoplay();
      featuredScrollController = null;
    },
    { once: true },
  );

  startAutoplay();

  featuredSlider.addEventListener("mouseenter", stopAutoplay, { signal });
  featuredSlider.addEventListener("mouseleave", startAutoplay, { signal });

  featuredSlider.addEventListener("touchstart", stopAutoplay, { signal });
  featuredSlider.addEventListener("touchend", startAutoplay, { signal });

  featuredSlider.addEventListener("focusin", stopAutoplay, { signal });
  featuredSlider.addEventListener("focusout", startAutoplay, { signal });

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
    { signal },
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
  scrollPrevBtn.addEventListener("focusin", stopAutoplay, { signal });
  scrollPrevBtn.addEventListener("focusout", startAutoplay, { signal });

  scrollPrevBtn.addEventListener(
    "click",
    () => {
      featuredSlider.scrollBy({ left: -featuredSlider.clientWidth });
    },
    { signal },
  );

  scrollNextBtn.addEventListener("mouseenter", stopAutoplay, { signal });
  scrollNextBtn.addEventListener("mouseleave", startAutoplay, { signal });
  scrollNextBtn.addEventListener("focusin", stopAutoplay, { signal });
  scrollNextBtn.addEventListener("focusout", startAutoplay, { signal });

  scrollNextBtn.addEventListener(
    "click",
    () => {
      featuredSlider.scrollBy({ left: featuredSlider.clientWidth });
    },
    { signal },
  );
}

export function updateFeaturedSlideFocus(featuredSlider: HTMLElement) {
  const slideWidth = featuredSlider.clientWidth;
  if (!slideWidth) return;

  const activeIndex = Math.round(featuredSlider.scrollLeft / slideWidth);
  const slides = Array.from(featuredSlider.children) as HTMLElement[];

  slides.forEach((slide, index) => {
    const isActive = index === activeIndex;

    slide.setAttribute("aria-hidden", (!isActive).toString());

    const focusableElements = slide.querySelectorAll<HTMLElement>("a, button");
    focusableElements.forEach((el) => {
      if (isActive) {
        el.setAttribute("tabindex", "0");
      } else {
        el.setAttribute("tabindex", "-1");
      }
    });
  });
}

export function cleanupFeaturedScroll() {
  featuredScrollController?.abort();
  featuredScrollController = null;
}
