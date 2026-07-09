import { toggleWatchlist } from "../watchlist/button-controller.js";
import { isInWatchlist } from "../watchlist/state.js";
import type { MediaPreview } from "../types/media-preview.js";
import type { TMDBContent } from "../types/tmdb-content.js";
import { createIcon } from "../utils/icon.js";

export function MediaActions(href: string | null, media: TMDBContent) {
  const isMediaWatchlisted = isInWatchlist(String(media.id), media.type);

  const fragment = document.createDocumentFragment();

  if (href) {
    const isYouTube = href.includes("youtube.com");

    const primaryBtn = document.createElement("a");
    primaryBtn.classList.add("btn", "btn--primary");
    primaryBtn.href = href;

    if (isYouTube) {
      primaryBtn.target = "_blank";
      primaryBtn.rel = "noopener noreferrer";

      const handleWindowFocus = () => {
        primaryBtn.classList.add("force-reset");

        window.removeEventListener("focus", handleWindowFocus);
      };

      window.addEventListener("focus", handleWindowFocus);

      primaryBtn.addEventListener(
        "mousemove",
        () => {
          primaryBtn.classList.remove("force-reset");
        },
        { passive: true },
      );
    }

    const primaryBtnIcon = isYouTube
      ? createIcon("icon-play", ["btn__icon", "btn__icon--light"])
      : createIcon("icon-info", ["btn__icon", "btn__icon--light"]);

    const primaryBtnText = document.createElement("span");
    primaryBtnText.textContent = isYouTube ? "Watch Trailer" : "More Info";

    primaryBtn.append(primaryBtnIcon, primaryBtnText);

    fragment.appendChild(primaryBtn);
  }

  const watchlistBtn = document.createElement("button");
  watchlistBtn.classList.add("btn", "btn--secondary", "watchlist-btn");

  const watchlistIconAdd = createIcon("icon-watchlist-add-outline", [
    "btn__icon",
    "btn__icon--light",
    "watchlist-btn__icon-add",
  ]);

  const watchlistIconCheck = createIcon("icon-watchlist-check", [
    "btn__icon",
    "watchlist-btn__icon-check",
  ]);

  const watchlistBtnText = document.createElement("span");
  watchlistBtnText.classList.add("watchlist-btn__text");
  watchlistBtnText.textContent = isMediaWatchlisted
    ? "Added to Watchlist"
    : "Add to Watchlist";

  watchlistBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();

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
      null,
      watchlistBtnText,
    );
  });

  watchlistBtn.append(watchlistIconAdd, watchlistIconCheck, watchlistBtnText);

  fragment.appendChild(watchlistBtn);

  return fragment;
}
