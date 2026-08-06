import { getElement } from "../utils/dom.js";

export function initHeaderAuthUI() {
  const isUserAuthenticated =
    window.__AUTH_STATE__?.isUserAuthenticated ?? false;
  const signInBtn = getElement("[data-js='site-header-signin-btn']");
  const profileLink = getElement("[data-js='site-header-profile-link']");

  signInBtn.classList.toggle("is-hidden", isUserAuthenticated);
  profileLink.classList.toggle("is-visible", isUserAuthenticated);
}
