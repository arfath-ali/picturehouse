import { createIcon } from "../utils/icon.js";

export function ErrorState(page: string) {
  const section = document.createElement("section");
  section.classList.add("site-error");

  if (page === "signup-page") {
    section.classList.add("auth-card");
    const picturehouseLogo = document.createElement("img");
    picturehouseLogo.classList.add(
      "h-auto",
      "w-[clamp(11.25rem,7.679rem+9.524vw,16.25rem)]",
      "mb-2",
    );
    picturehouseLogo.src = "/src/assets/images/brand.png";

    section.append(picturehouseLogo);
  }

  const icon = createIcon("icon-error", ["site-error__icon"]);

  const heading = document.createElement("h1");
  heading.textContent = "Something went wrong";

  const description = document.createElement("p");

  if (page === "signup-page") {
    description.textContent =
      "We couldn't create your account right now. Please try again in a few moments.";
  } else if (page === "browse-page") {
    description.textContent =
      "We couldn't load the content right now. Please try again in a few moments.";
  } else if (page === "search-page") {
    description.textContent =
      "We couldn't load the search page right now. Please try again in a few moments.";
  } else if (page === "details-page") {
    description.textContent =
      "We couldn't load this title right now. Please try again in a few moments.";
  } else if (page === "watchlist-page") {
    description.textContent =
      "We couldn't load your watchlist right now. Please try again in a few moments.";
  }

  const retryBtn = document.createElement("button");
  retryBtn.classList.add("btn", "btn--primary", "site-error__retry-btn");
  retryBtn.textContent = "Try Again";

  retryBtn.addEventListener("click", () => {
    window.location.reload();
  });

  section.append(icon, heading, description, retryBtn);

  return section;
}
