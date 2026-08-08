import { getElement } from "../utils/dom.js";

export function initHeaderAuthUI() {
  const isUserAuthenticated =
    window.__AUTH_STATE__?.isUserAuthenticated ?? false;
  const signInBtn = getElement("[data-js='site-header-signin-btn']");
  const profileBtn = getElement("[data-js='site-header-profile-btn']");

  signInBtn.classList.toggle("is-hidden", isUserAuthenticated);
  profileBtn.classList.toggle("is-visible", isUserAuthenticated);
}
