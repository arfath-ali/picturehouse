import { toggleWatchlist } from "../watchlist/button-controller.js";
import { isInWatchlist } from "../watchlist/state.js";
import type { MediaPreview } from "../types/media-preview.js";
import type { TMDBContent } from "../types/tmdb-content.js";
import { createIcon } from "../utils/icon.js";
import { createSlug } from "../utils/slugify.js";

export function MediaCard(
  media: TMDBContent | MediaPreview,
  signal: AbortSignal,
): HTMLLIElement {
  const page = document.body.dataset.state;

  const isWatchlistPage =
    page === "watchlist" ||
    page === "watchlist-movies" ||
    page === "watchlist-tv-shows";

  const isMediaWatchlisted = isInWatchlist(String(media.id), media.type);

  let watchlistIconAdd: SVGSVGElement | null = null;
  let watchlistIconCheck: SVGSVGElement | null = null;

  const posterURL = media.images.poster;

  const cardItem = document.createElement("li");
  cardItem.classList.add("media-card__item");
  cardItem.dataset.tmdbId = media.id;
  cardItem.dataset.mediaType = media.type;
  cardItem.setAttribute("aria-hidden", "true");

  const cardLink = document.createElement("a");
  cardLink.className = "media-card__link";
  cardLink.href = `/${media.type}/${createSlug(media.title)}-${media.id}`;
  cardLink.setAttribute("tabindex", "-1");

  const cardPosterWrapper = document.createElement("div");
  cardPosterWrapper.classList.add("media-card__poster-wrapper");

  const cardPoster = document.createElement("img");
  cardPoster.classList.add("media-card__poster");
  cardPoster.alt = "";
  cardPoster.loading = "lazy";

  const showPosterPlaceholder = () => {
    cardPoster.remove();

    cardPosterWrapper.classList.add("media-card__poster-wrapper--placeholder");

    const placeholder = document.createElement("div");
    placeholder.classList.add("media-card__poster--placeholder-wrapper");

    const placeholderIcon = createIcon("icon-poster-fallback", [
      "media-card__poster--placeholder",
    ]);

    placeholder.append(placeholderIcon);
    cardPosterWrapper.append(placeholder);
  };

  if (posterURL) {
    const responsivePosterURL =
      window.innerWidth < 480 ? posterURL.small : posterURL.medium;

    cardPoster.onerror = showPosterPlaceholder;
    cardPoster.src = responsivePosterURL;

    cardPosterWrapper.append(cardPoster);
  } else {
    showPosterPlaceholder();
  }

  const watchlistBtn = document.createElement("button");
  watchlistBtn.classList.add("watchlist-btn", "watchlist-btn--badge");
  watchlistBtn.setAttribute("tabindex", "-1");

  if (isWatchlistPage) {
    const watchlistIconRemove = createIcon("icon-watchlist-remove", [
      "btn__icon",
      "watchlist-btn__icon-remove",
    ]);
    watchlistBtn.append(watchlistIconRemove);
  } else {
    watchlistIconAdd = createIcon("icon-watchlist-add", [
      "btn__icon",
      "watchlist-btn__icon-add",
    ]);
    watchlistIconAdd.classList.toggle("is-hidden", isMediaWatchlisted);

    watchlistIconCheck = createIcon("icon-watchlist-check", [
      "btn__icon",
      "watchlist-btn__icon-check",
    ]);
    watchlistIconCheck.classList.toggle("is-visible", isMediaWatchlisted);

    watchlistBtn.append(watchlistIconAdd, watchlistIconCheck);
  }

  watchlistBtn.addEventListener(
    "click",
    async (e) => {
      e.stopPropagation();
      e.preventDefault();

      const watchlistMediaElement = isWatchlistPage
        ? (e.target as HTMLElement).closest("li")
        : null;

      const mediaPayload: MediaPreview = {
        id: media.id,
        type: media.type,
        title: media.title,
        images: {
          poster: media.images.poster
            ? {
                small: media.images.poster.small,
                medium: media.images.poster.medium,
              }
            : null,
        },
      };

      toggleWatchlist(
        watchlistBtn,
        mediaPayload,
        watchlistIconAdd,
        watchlistIconCheck,
        watchlistMediaElement,
      );
    },
    { signal },
  );

  cardPosterWrapper.append(watchlistBtn);

  const cardTitle = document.createElement("h3");
  cardTitle.classList.add("media-card__content-title");
  cardTitle.textContent = media.title;

  cardLink.append(cardPosterWrapper, cardTitle);

  cardItem.appendChild(cardLink);

  return cardItem;
}
