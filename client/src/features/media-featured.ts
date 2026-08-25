import { apiRequest } from "../api/api-request.js";
import { MediaActions } from "../components/media-actions.js";
import { API_BASE_URL } from "../config/api.js";
import { USER_REGION } from "../config/region.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { setAppState } from "../state/app.js";
import type { FeaturedCollectionResponse } from "../types/api-response.js";
import type { pageCategory } from "../types/page-category.js";
import type { TMDBContent } from "../types/tmdb-content.js";
import { getElement } from "../utils/dom.js";
import { isApiError } from "../utils/is-api-error.js";
import { showPageError } from "../utils/show-page-error.js";
import { createSkeletonFragment } from "../utils/skeleton-structure.js";
import { createSlug } from "../utils/slugify.js";

let featuredController: AbortController | null = null;
let featuredCache: Record<string, TMDBContent[]> = {};

export async function renderfeatured() {
  const page = location.pathname.slice(1) as pageCategory;

  const validPages: pageCategory[] = ["home", "movies", "tv-shows"];

  if (!validPages.includes(page)) return;

  const featuredSlider = getElement(".featured__slider");

  featuredSlider.append(createSkeletonFragment(1, "featured__item-skeleton"));

  featuredController?.abort();
  featuredController = new AbortController();

  const signal = featuredController.signal;

  try {
    let featuredCollection: TMDBContent[] = [];

    if (featuredCache[page]) {
      featuredCollection = featuredCache[page];
    } else {
      const response = await apiRequest<FeaturedCollectionResponse>(
        `${API_BASE_URL}/${API_ENDPOINTS.FEATURED(page)}`,
        {
          method: "GET",
          signal,
        },
      );
      featuredCollection = response.featuredCollection;
      featuredCache[page] = featuredCollection;
    }

    if (!featuredCollection || featuredCollection.length === 0) {
      console.error(
        "Failed to load featured collection: empty or invalid response",
      );
      showPageError("browse-page");
      return;
    }

    featuredSlider.innerHTML = "";
    const fragment = document.createDocumentFragment();

    const assetLoadPromises: Promise<void>[] = [];

    featuredCollection.forEach((media: TMDBContent) => {
      const detailsURL = `/${media.type}/${createSlug(media.title)}-${media.id}`;

      const itemEl = document.createElement("li");
      itemEl.classList.add("featured__item");
      itemEl.dataset.tmdbId = media.id;
      itemEl.dataset.mediaType = media.type;
      itemEl.setAttribute("aria-hidden", "true");

      const linkEl = document.createElement("a");
      linkEl.href = detailsURL;
      linkEl.classList.add("featured__link");
      linkEl.setAttribute("tabindex", "-1");

      const backdropURL = media.images?.backdrop;

      const hue = media.theme.hue;
      const saturation = media.theme.saturation;
      const lightness = media.theme.lightness;

      const themeGradient = `hsl(${hue} ${saturation} ${lightness})`;

      linkEl.style.setProperty("--bg-color", themeGradient);

      if (backdropURL) {
        const width = window.innerWidth;
        let responsiveBackdropURL;

        if (width < 1024) {
          responsiveBackdropURL = backdropURL.medium;
        } else {
          responsiveBackdropURL = backdropURL.large;
        }

        const backdropPromise = new Promise<void>((resolve) => {
          const backdropImg = new Image();
          backdropImg.src = responsiveBackdropURL;

          backdropImg.onload = () => {
            linkEl.style.setProperty(
              "--bg-backdrop",
              `url('${responsiveBackdropURL}')`,
            );
            linkEl.classList.add("has-backdrop");
            resolve();
          };

          backdropImg.onerror = () => {
            linkEl.classList.remove("has-backdrop");
            resolve();
          };
        });

        assetLoadPromises.push(backdropPromise);
      }

      const headerEl = document.createElement("div");
      headerEl.classList.add("featured__header");

      const titleContainer = document.createElement("div");
      titleContainer.classList.add("featured__title-container");

      const titleText = document.createElement("h1");
      titleText.classList.add("featured__title-text", "is-hidden");
      titleText.textContent = media.title;

      titleContainer.appendChild(titleText);

      if (media.images.logo) {
        const titleImg = document.createElement("img");
        titleImg.classList.add("featured__title-img");
        titleImg.alt = media.title;

        const titleImgPromise: Promise<void> = new Promise((resolve) => {
          titleImg.onload = () => {
            titleContainer.classList.add("is-loaded");
            resolve();
          };

          titleImg.onerror = () => {
            titleImg.remove();
            titleContainer.classList.remove("is-loaded");
            titleText.classList.remove("is-hidden");
            resolve();
          };
        });

        assetLoadPromises.push(titleImgPromise);

        titleImg.src = media.images.logo;
        titleContainer.appendChild(titleImg);
      } else {
        titleText.classList.remove("is-hidden");
      }

      const metaContainer = document.createElement("div");
      metaContainer.classList.add(
        "meta-row",
        "text-secondary",
        "featured__meta",
      );

      const metaData = [
        media.releaseYear,
        media.duration,
        media.certification?.[USER_REGION],
      ].filter((text) => text !== null && text !== undefined && text !== "");

      metaData.forEach((text, index) => {
        if (text) {
          const spanEl = document.createElement("span");
          if (text === media.certification?.[USER_REGION]) {
            spanEl.classList.add("meta-certification");
          }
          spanEl.textContent = text;
          metaContainer.appendChild(spanEl);

          if (index < metaData.length - 1) {
            const dividerEl = document.createElement("span");
            dividerEl.textContent = "•";
            metaContainer.appendChild(dividerEl);
          }
        }
      });

      headerEl.append(titleContainer, metaContainer);

      const overviewEl = document.createElement("p");
      overviewEl.classList.add("featured__overview");
      overviewEl.textContent = media.overview;

      const actionsEl = document.createElement("div");
      actionsEl.classList.add("featured__actions");

      const mediaActionsFragment = MediaActions(detailsURL, media, signal);
      mediaActionsFragment.querySelectorAll("a, button").forEach((el) => {
        el.setAttribute("tabindex", "-1");
      });

      actionsEl.appendChild(mediaActionsFragment);

      linkEl.append(headerEl, overviewEl, actionsEl);
      itemEl.appendChild(linkEl);
      fragment.appendChild(itemEl);
    });

    featuredSlider.appendChild(fragment);

    await Promise.all(assetLoadPromises);
  } catch (error: unknown) {
    console.error(`Failed to load featured content for [${page}] page:`, error);

    if (isApiError(error) && error.status === 404) {
      setAppState("not-found");
      return;
    }

    showPageError("browse-page");
  } finally {
    featuredController = null;
  }
}

export function cleanupFeaturedRequest() {
  featuredController?.abort();
  featuredController = null;
}
