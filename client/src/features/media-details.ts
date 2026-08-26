import { MediaActions } from "../components/media-actions.js";
import { USER_REGION } from "../config/region.js";
import { initCastScroll } from "../scroll/media-details.js";
import { setAppState } from "../state/app.js";
import { getElement } from "../utils/dom.js";
import { createIcon } from "../utils/icon.js";
import { updatePageTitle } from "../utils/title.js";
import { createSkeletonFragment } from "../utils/skeleton-structure.js";
import { createSlug } from "../utils/slugify.js";
import { showPageError } from "../utils/show-page-error.js";
import { apiRequest } from "../api/api-request.js";
import type { MediaDetailsReponse } from "../types/api-response.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { API_BASE_URL } from "../config/api.js";
import { isApiError } from "../utils/is-api-error.js";

let detailsController: AbortController | null = null;

export async function renderDetails(
  mediaType: string,
  currentTitleSlug: string,
  tmdbId: string,
) {
  const width = window.innerWidth;

  const mediaDetailsSection = getElement<HTMLElement>(".media-details");

  const loadingSpinner = document.createElement("div");
  setTimeout(() => {
    loadingSpinner.classList.add("spinner");
  }, 300);

  mediaDetailsSection.innerHTML = "";
  mediaDetailsSection.classList.remove("has-backdrop");
  mediaDetailsSection.classList.remove("has-poster-backdrop");
  mediaDetailsSection.style.removeProperty("--bg-backdrop");
  mediaDetailsSection.style.removeProperty("--bg-color");
  mediaDetailsSection.appendChild(loadingSpinner);

  const criticalImagePromises: Promise<void>[] = [];

  detailsController?.abort();
  detailsController = new AbortController();
  const signal = detailsController.signal;

  try {
    const { mediaDetails } = await apiRequest<MediaDetailsReponse>(
      `${API_BASE_URL}/${API_ENDPOINTS.DETAILS(mediaType, tmdbId)}`,
      {
        method: "GET",
        signal,
      },
    );

    loadingSpinner.remove();

    const correctTitleSlug = createSlug(mediaDetails.title);
    const correctUrl = `/${mediaDetails.type}/${correctTitleSlug}-${tmdbId}`;

    if (currentTitleSlug !== correctTitleSlug) {
      window.location.replace(correctUrl);
    }

    const mediaDetailsContent = document.createElement("div");
    mediaDetailsContent.classList.add("media-details__content");

    const backdropURL = mediaDetails.images.backdrop;
    const posterURL = mediaDetails.images.poster;

    const hue = mediaDetails.theme.hue;
    const saturation = mediaDetails.theme.saturation;
    const lightness = mediaDetails.theme.lightness;

    const themeGradient = `hsl(${hue} ${saturation} ${lightness})`;

    mediaDetailsSection.style.setProperty("--bg-color", themeGradient);

    if (backdropURL) {
      let responsiveBackdropURL;

      if (width < 1024) {
        responsiveBackdropURL = backdropURL?.medium;
      } else {
        responsiveBackdropURL = backdropURL?.large;
      }

      const backdropImg = new Image();

      const backdropPromise: Promise<void> = new Promise((resolve) => {
        backdropImg.onload = () => {
          mediaDetailsSection.style.setProperty(
            "--bg-backdrop",
            `url('${responsiveBackdropURL}')`,
          );

          mediaDetailsSection.classList.add("has-backdrop");
          resolve();
        };

        backdropImg.onerror = () => {
          mediaDetailsSection.classList.remove("has-backdrop");
          resolve();
        };
      });

      criticalImagePromises.push(backdropPromise);
      backdropImg.src = responsiveBackdropURL;
    } else if (posterURL) {
      let responsivePosterBackdropURL;

      if (width < 500) {
        responsivePosterBackdropURL = posterURL.medium;
      } else {
        responsivePosterBackdropURL = posterURL.large;
      }

      const posterBackdropImg = new Image();

      const posterBackdropImgPromise: Promise<void> = new Promise((resolve) => {
        posterBackdropImg.onload = () => {
          mediaDetailsSection.style.setProperty(
            "--bg-backdrop",
            `url('${responsivePosterBackdropURL}')`,
          );
          mediaDetailsSection.classList.add("has-poster-backdrop");
          resolve();
        };

        posterBackdropImg.onerror = () => {
          mediaDetailsSection.classList.remove("has-poster-backdrop");
          resolve();
        };
      });
      criticalImagePromises.push(posterBackdropImgPromise);
      posterBackdropImg.src = responsivePosterBackdropURL;
    }

    const headerEl = document.createElement("div");
    headerEl.classList.add("media-details__header");

    const titleContainer = document.createElement("div");
    titleContainer.classList.add("media-details__title-container");

    const titleText = document.createElement("h1");
    titleText.classList.add("media-details__title-text");
    titleText.textContent = mediaDetails.title;

    titleContainer.classList.add("is-waiting");
    titleContainer.appendChild(titleText);

    if (mediaDetails.images.logo) {
      const titleImg = document.createElement("img");
      titleImg.classList.add("media-details__title-img");
      titleImg.alt = mediaDetails.title;

      let isDelayed = false;

      const fallbackTimer = setTimeout(() => {
        isDelayed = true;
        titleContainer.classList.remove("is-waiting");
      }, 300);

      const titleImgPromise: Promise<void> = new Promise((resolve) => {
        titleImg.onload = () => {
          if (isDelayed) {
            setTimeout(() => {
              titleContainer.classList.add("has-delayed-logo");
              resolve();
            }, 500);
          } else {
            titleContainer.classList.add("is-loaded");
            titleContainer.classList.remove("is-waiting");
            resolve();
          }

          clearTimeout(fallbackTimer);
        };

        titleImg.onerror = () => {
          clearTimeout(fallbackTimer);
          titleImg.remove();
          titleContainer.classList.remove("is-waiting");
          titleContainer.classList.remove("is-loaded");
          titleContainer.classList.remove("has-delayed-logo");
          resolve();
        };
      });

      criticalImagePromises.push(titleImgPromise);
      titleImg.src = mediaDetails.images.logo;
      titleContainer.appendChild(titleImg);
    } else {
      titleContainer.classList.remove("is-waiting");
    }
    headerEl.append(titleContainer);

    if (mediaDetails.tagline) {
      const tagline = document.createElement("p");
      tagline.classList.add("text-secondary", "media-details__tagline");
      tagline.textContent = `"${mediaDetails.tagline}"`;

      headerEl.append(tagline);
    }

    mediaDetailsContent.append(headerEl);

    const metaContainer = document.createElement("div");
    metaContainer.classList.add(
      "meta-row",
      "text-secondary",
      "media-details__meta-row",
    );

    const metaData = [
      mediaDetails.releaseYear,
      mediaDetails.duration,
      mediaDetails.certification?.[USER_REGION],
    ].filter((text) => text !== null && text !== undefined && text !== "");

    metaData.forEach((text, index) => {
      if (text) {
        const spanEl = document.createElement("span");

        if (text === mediaDetails.certification?.[USER_REGION]) {
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

    headerEl.appendChild(metaContainer);

    if (mediaDetails.genres) {
      const genreCarousalContainer = document.createElement("div");
      genreCarousalContainer.classList.add("media-details__genres");

      mediaDetails.genres.forEach((genre: string) => {
        const genreType = document.createElement("span");
        genreType.classList.add("media-details__genre-tag");
        genreType.textContent = genre;

        genreCarousalContainer.appendChild(genreType);
      });

      mediaDetailsContent.appendChild(genreCarousalContainer);
    }

    const actionsEl = document.createElement("div");
    actionsEl.classList.add("media-details__actions");

    actionsEl.appendChild(
      MediaActions(mediaDetails.youtubeTrailerURL, mediaDetails, signal),
    );
    mediaDetailsContent.appendChild(actionsEl);

    const overviewEl = document.createElement("p");
    overviewEl.textContent = mediaDetails.overview;

    mediaDetailsContent.appendChild(overviewEl);

    if (mediaDetails.crew.creator) {
      const crewSection = document.createElement("div");
      crewSection.classList.add("media-details__crew-section");

      const creatorSection = document.createElement("div");
      creatorSection.classList.add("media-details__crew-item");

      const createdByLabel = document.createElement("span");
      createdByLabel.classList.add("text-secondary");
      createdByLabel.textContent = "Created by";

      const creatorList = document.createElement("div");
      creatorList.classList.add("media-details__crew-list");

      const creatorsArray = mediaDetails.crew.creator;

      mediaDetails.crew.creator.forEach(
        (creatorName: string, index: number) => {
          const creatorNameEl = document.createElement("span");
          creatorNameEl.textContent = creatorName;
          creatorList.appendChild(creatorNameEl);

          if (index < creatorsArray.length - 1) {
            creatorList.appendChild(document.createTextNode(", "));
          }
        },
      );

      creatorSection.append(createdByLabel, creatorList);
      crewSection.appendChild(creatorSection);
      mediaDetailsContent.appendChild(crewSection);
    }

    if (mediaDetails.crew.director || mediaDetails.crew.writer) {
      const crewSection = document.createElement("div");
      crewSection.classList.add("media-details__crew-section");

      const directorsArray = mediaDetails.crew.director ?? null;
      const writersArray = mediaDetails.crew.writer ?? null;

      const isSameCrew =
        directorsArray?.length === writersArray?.length &&
        directorsArray?.every((name) => writersArray?.includes(name));

      const sharedCrewArray = isSameCrew ? directorsArray : [];

      if (isSameCrew) {
        const sharedCrewSection = document.createElement("div");
        sharedCrewSection.classList.add("media-details__crew-item");

        const sharedCrewList = document.createElement("div");
        sharedCrewList.classList.add("media-details__crew-list");

        const sharedCrewLabel = document.createElement("span");
        sharedCrewLabel.classList.add(
          "text-secondary",
          "media-details__crew-label",
        );
        sharedCrewLabel.textContent = "Written & Directed by";

        sharedCrewArray?.forEach((sharedCrewName: string, index: number) => {
          const sharedCrewNameEl = document.createElement("span");
          sharedCrewNameEl.textContent = sharedCrewName;
          sharedCrewList.appendChild(sharedCrewNameEl);

          if (index < sharedCrewArray?.length - 1) {
            sharedCrewList.appendChild(document.createTextNode(", "));
          }
        });

        sharedCrewSection.append(sharedCrewLabel, sharedCrewList);
        crewSection.appendChild(sharedCrewSection);
      } else {
        if (directorsArray) {
          const directorSection = document.createElement("div");
          directorSection.classList.add("media-details__crew-item");

          const directorList = document.createElement("div");
          directorList.classList.add("media-details__crew-list");

          const directedByLabel = document.createElement("span");
          directedByLabel.classList.add(
            "text-secondary",
            "media-details__crew-label",
          );
          directedByLabel.textContent = "Directed by";

          directorsArray.forEach((directorName: string, index: number) => {
            const directorNameEl = document.createElement("span");
            directorNameEl.textContent = directorName;
            directorNameEl.classList.add("media-details__crew-name");
            directorList.appendChild(directorNameEl);

            if (index < directorsArray.length - 1) {
              directorList.appendChild(document.createTextNode(", "));
            }
          });

          directorSection.append(directedByLabel, directorList);
          crewSection.appendChild(directorSection);
        }

        if (directorsArray && writersArray) {
          const crewDivider = document.createElement("div");
          crewDivider.classList.add("media-details__crew-divider");
          crewSection.appendChild(crewDivider);
        }

        if (writersArray) {
          const writerSection = document.createElement("div");
          writerSection.classList.add("media-details__crew-item");

          const writerList = document.createElement("div");
          writerList.classList.add("media-details__crew-list");

          const writtenByLabel = document.createElement("span");
          writtenByLabel.classList.add(
            "text-secondary",
            "media-details__crew-label",
          );
          writtenByLabel.textContent = "Written by";

          writersArray.forEach((writerName: string, index: number) => {
            const writerNameEl = document.createElement("span");
            writerNameEl.classList.add("media-details__crew-name");
            writerNameEl.textContent = writerName;
            writerList.appendChild(writerNameEl);

            if (index < writersArray.length - 1) {
              writerList.appendChild(document.createTextNode(", "));
            }
          });

          writerSection.append(writtenByLabel, writerList);
          crewSection.appendChild(writerSection);
        }
      }

      mediaDetailsContent.appendChild(crewSection);
    }

    if (mediaDetails.ratings.imdb || mediaDetails.ratings.rottenTomatoes) {
      const ratingsSection = document.createElement("div");
      ratingsSection.classList.add("media-details__ratings-section");

      const ratingsHeading = document.createElement("span");
      ratingsHeading.classList.add("media-details__block-heading");
      ratingsHeading.textContent = "RATINGS";

      const ratingsContainer = document.createElement("div");
      ratingsContainer.classList.add("media-details__ratings-container");

      if (mediaDetails.ratings.imdb) {
        const imdbContainer = document.createElement("div");
        imdbContainer.classList.add("media-details__rating");

        const imdbLogoEl = createIcon("icon-imdb", [
          "media-details__rating-logo",
        ]);

        const imdbLabelEl = document.createElement("span");
        imdbLabelEl.classList.add("media-details__rating-label");
        imdbLabelEl.textContent = "IMDb";

        const imdbRatingEl = document.createElement("span");
        imdbRatingEl.classList.add("media-details__rating-score");
        imdbRatingEl.textContent = mediaDetails.ratings.imdb;

        imdbContainer.append(imdbLogoEl, imdbLabelEl, imdbRatingEl);
        ratingsContainer.appendChild(imdbContainer);
      }

      if (mediaDetails.ratings.imdb && mediaDetails.ratings.rottenTomatoes) {
        const ratingsDivider = document.createElement("div");
        ratingsDivider.classList.add("media-details__ratings-divider");
        ratingsContainer.appendChild(ratingsDivider);
      }

      if (mediaDetails.ratings.rottenTomatoes) {
        const rottenTomatoesContainer = document.createElement("div");
        rottenTomatoesContainer.classList.add("media-details__rating");

        const rottenTomatoesLogoEl = createIcon("icon-rotten-tomatoes", [
          "media-details__rating-logo",
        ]);
        const rottenTomatoesLabelEl = document.createElement("span");
        rottenTomatoesLabelEl.classList.add("media-details__rating-label");
        rottenTomatoesLabelEl.textContent = "Rotten Tomatoes";

        const rottenTomatoesRatingEl = document.createElement("span");
        rottenTomatoesRatingEl.classList.add("media-details__rating-score");
        rottenTomatoesRatingEl.textContent =
          mediaDetails.ratings.rottenTomatoes;

        rottenTomatoesContainer.append(
          rottenTomatoesLogoEl,
          rottenTomatoesLabelEl,
          rottenTomatoesRatingEl,
        );

        ratingsContainer.appendChild(rottenTomatoesContainer);
      }

      ratingsSection.append(ratingsHeading, ratingsContainer);

      mediaDetailsContent.appendChild(ratingsSection);
    }

    if (mediaDetails?.streamingPlatforms?.[USER_REGION]) {
      const regionalPlatforms =
        mediaDetails.streamingPlatforms[USER_REGION] || [];

      const streamingSection = document.createElement("div");

      const streamingHeading = document.createElement("span");
      streamingHeading.classList.add("media-details__block-heading");
      streamingHeading.textContent = "Available on";

      const streamingList = document.createElement("div");
      streamingList.classList.add("media-details__streaming-list");

      regionalPlatforms.forEach((platform) => {
        const platformItem = document.createElement("div");
        platformItem.classList.add("media-details__streaming-item");

        const platformLogoContainer = document.createElement("div");
        platformLogoContainer.classList.add("media-details__streaming-logo");

        const platformLogo = document.createElement("img");
        platformLogo.classList.add("media-details__streaming-logo-img");

        const showFallbackIcon = () => {
          platformLogo.remove();

          const fallbackIcon = createIcon("icon-stream", [
            "media-details__streaming-logo-icon",
          ]);
          platformLogoContainer.append(fallbackIcon);
        };

        const platformLogoPromise = new Promise<void>((resolve) => {
          platformLogo.onload = () => resolve();

          platformLogo.onerror = () => {
            showFallbackIcon();
            resolve();
          };
        });

        criticalImagePromises.push(platformLogoPromise);

        if (platform.logo) {
          platformLogo.src = platform.logo;
          platformLogo.alt = "";
          platformLogoContainer.append(platformLogo);
        } else {
          showFallbackIcon();
        }

        const platformName = document.createElement("span");
        platformName.classList.add("media-details__streaming-name");
        platformName.textContent = platform.name;

        platformItem.append(platformLogoContainer, platformName);
        streamingList.append(platformItem);
      });

      streamingSection.append(streamingHeading, streamingList);

      mediaDetailsContent.appendChild(streamingSection);
    }

    if (mediaDetails.cast) {
      const castSection = document.createElement("div");
      castSection.classList.add("media-details__cast-section");

      const castLabel = document.createElement("span");
      castLabel.classList.add("media-details__block-heading");
      castLabel.textContent = "Cast";

      const castListContainer = document.createElement("div");
      castListContainer.classList.add("media-details__cast-list-container");

      const prevBtnContainer = document.createElement("div");
      const prevBtn = document.createElement("button");
      const nextBtnContainer = document.createElement("div");
      const nextBtn = document.createElement("button");

      prevBtnContainer.classList.add(
        "scroll-container",
        "media-details__scroll-container",
        "media-details__scroll-container--prev",
        "hidden",
      );
      prevBtn.classList.add(
        "scroll-btn",
        "media-details__scroll-btn",
        "media-details__scroll-btn--prev",
      );
      prevBtn.setAttribute("aria-label", "Previous slide");
      prevBtn.appendChild(createIcon("icon-arrow-prev", ["scroll-btn__icon"]));

      nextBtnContainer.classList.add(
        "scroll-container",
        "media-details__scroll-container",
        "media-details__scroll-container--next",
        "hidden",
      );
      nextBtn.classList.add(
        "scroll-btn",
        "media-details__scroll-btn",
        "media-details__scroll-btn--next",
      );
      nextBtn.setAttribute("aria-label", "Next slide");
      nextBtn.appendChild(createIcon("icon-arrow-next", ["scroll-btn__icon"]));

      prevBtnContainer.appendChild(prevBtn);
      nextBtnContainer.appendChild(nextBtn);

      const castList = document.createElement("div");
      castList.classList.add("media-details__cast-list");

      castList.setAttribute("tabindex", "-1");

      castList.appendChild(
        createSkeletonFragment(
          mediaDetails.cast.length,
          "media-details__cast-skeleton",
        ),
      );

      mediaDetails.cast.forEach(
        (
          actor: {
            name: string;
            profileImg: string | null;
            character: string | null;
          },
          index,
        ) => {
          const actorCard = document.createElement("div");
          actorCard.classList.add("media-details__cast-item");

          const matchingSkeleton = castList.children[index] as HTMLElement;

          const actorPhoto = document.createElement("img");
          actorPhoto.classList.add("media-details__cast-photo");

          const swapSkeletonWithCard = () => {
            if (matchingSkeleton) {
              matchingSkeleton.replaceWith(actorCard);
            }
          };

          let photoNode: HTMLImageElement | SVGSVGElement;

          if (actor.profileImg) {
            const actorPhoto = document.createElement("img");
            actorPhoto.classList.add("media-details__cast-photo");
            actorPhoto.src = actor.profileImg;
            actorPhoto.alt = actor.name;
            actorPhoto.loading = "lazy";

            actorPhoto.onerror = () => {
              const icon = createIcon("icon-actor-profile", [
                "media-details__cast-photo",
                "media-details__cast-photo--placeholder",
              ]);
              actorPhoto.replaceWith(icon);
            };

            photoNode = actorPhoto;
          } else {
            photoNode = createIcon("icon-actor-profile", [
              "media-details__cast-photo",
              "media-details__cast-photo--placeholder",
            ]);
          }

          actorPhoto.loading = "lazy";

          const actorName = document.createElement("span");
          actorName.classList.add("media-details__cast-name");
          actorName.textContent = actor.name;

          const actorCharacter = document.createElement("span");
          actorCharacter.classList.add(
            "text-secondary",
            "media-details__cast-character",
          );
          actorCharacter.textContent = actor.character ?? "";

          actorCard.append(photoNode, actorName, actorCharacter);

          swapSkeletonWithCard();
        },
      );

      castListContainer.append(prevBtnContainer, castList, nextBtnContainer);
      castSection.append(castLabel, castListContainer);
      mediaDetailsContent.appendChild(castSection);
    }

    mediaDetailsSection.appendChild(mediaDetailsContent);

    if (criticalImagePromises.length > 0) {
      await Promise.all(criticalImagePromises);
    }

    updatePageTitle("details", mediaDetails.title, false);

    if (mediaDetails.cast) {
      initCastScroll();
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") return;

    console.error(`Failed to load media details for [${tmdbId}]:`, error);

    if (isApiError(error) && error.status === 404) {
      setAppState("not-found");
      return;
    }

    showPageError("details-page");
  } finally {
    detailsController = null;
  }
}

export function cleanupDetailsRequest() {
  detailsController?.abort();
  detailsController = null;
}
