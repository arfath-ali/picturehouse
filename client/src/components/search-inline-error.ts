import { createIcon } from "../utils/icon.js";

export function searchInlineError() {
  const section = document.createElement("section");
  section.classList.add("site-error", "site-error--inline");

  const icon = createIcon("icon-error", ["site-error__icon"]);

  const heading = document.createElement("h1");
  heading.textContent = "Couldn't load search results";

  const description = document.createElement("p");

  description.textContent =
    "We couldn't load the search results right now. Please try again in a few moments.";

  const retryBtn = document.createElement("button");
  retryBtn.classList.add("btn", "btn--primary", "site-error__retry-btn");
  retryBtn.textContent = "Try Again";

  retryBtn.addEventListener("click", () => {
    window.location.reload();
  });

  section.append(icon, heading, description, retryBtn);

  return section;
}
