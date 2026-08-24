import { getElement } from "../utils/dom.js";

export function initHeaderAuthUI() {
  const isUserAuthenticated =
    window.__AUTH_STATE__?.isUserAuthenticated ?? false;

  const avatar = window.__AUTH_STATE__.avatarURL;

  const signInBtn = getElement("[data-js='site-header-signin-btn']");
  const profileBtn = getElement<HTMLElement>(
    "[data-js='site-header-profile-btn']",
  );
  const profileAvatarImg = getElement<HTMLImageElement>(
    "[data-js='site-header-profile-avatar-img']",
  );

  if (avatar) {
    profileAvatarImg.onload = () => {
      profileBtn.dataset.hasAvatar = "true";
    };

    profileAvatarImg.onerror = () => {
      profileBtn.dataset.hasAvatar = "false";
    };

    profileAvatarImg.src = avatar;
  } else {
    profileBtn.dataset.hasAvatar = "false";
    profileAvatarImg.removeAttribute("src");
  }

  signInBtn.classList.toggle("is-hidden", isUserAuthenticated);
  profileBtn.classList.toggle("is-visible", isUserAuthenticated);
}
