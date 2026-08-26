import { renderDetails } from "../features/media-details.js";
import { setAppState } from "../state/app.js";
import type { AppState } from "../types/app-state.js";
import { initFeatured } from "../init/media-featured.js";
import { initShelves } from "../init/media-shelf.js";
import { initSearchInput } from "../init/search-input.js";
import { getElement } from "../utils/dom.js";
import { initWatchlist } from "../watchlist/init.js";
import { initSignUp } from "../auth/sign-up.js";
import { authStore } from "../state/auth-store.js";
import { initEmailVerification } from "../auth/verify-email.js";
import { cleanupAllRequests } from "../utils/cleanup.js";
import { togglePasswordVisibilty } from "../utils/password-visibility.js";
import { initSignIn } from "../auth/sign-in.js";
import {
  cleanupWindowScrollManager,
  clearAllScrollStorage,
  initWindowScrollManager,
} from "../scroll/window.js";
import { googleAuth } from "../auth/google-auth.js";
import { googleAuthCallback } from "../auth/google-auth-callback.js";
import { initHeaderScroll } from "../scroll/header.js";
import { initForgotPassword } from "../auth/forgot-password.js";
import { initResetPasswordEmailSent } from "../auth/reset-password-email-sent.js";
import { initResetPassword } from "../auth/reset-password.js";
import { profileDropdown } from "../components/profile-dropdown.js";
import { initSignOut } from "../auth/sign-out.js";
import { initProfile } from "../profile/init.js";
import { initDeleteAccount } from "../auth/delete-account.js";
import { initEditIdentity } from "../profile/edit-identity.js";
import { initPasswordCard } from "../profile/password-card.js";
import { initEditPassword } from "../profile/edit-password.js";
import { initEditEmail } from "../profile/edit-email.js";
import { initEditAvatar } from "../profile/edit-avatar.js";
import { initWatchlistState } from "../watchlist/state.js";

function restoreVerticalScroll(category: string) {
  const savedVerticalScroll = sessionStorage.getItem(
    `scroll-window-${category}`,
  );

  const targetScrollY = savedVerticalScroll
    ? parseInt(savedVerticalScroll, 10)
    : 0;

  let scrollBehavior: ScrollBehavior = "instant";

  const isWatchlistPage =
    category === "watchlist" ||
    category === "watchlist-movies" ||
    category === "watchlist-tv-shows";

  if (isWatchlistPage) {
    const watchlistHeading = getElement(".watchlist__heading");

    if (watchlistHeading) {
      const isHeadingVisible =
        !watchlistHeading.classList.contains("is-hidden");

      if (isHeadingVisible) {
        scrollBehavior = "smooth";
      }
    }
  }
  window.scrollTo({
    top: targetScrollY,
    left: 0,
    behavior: scrollBehavior,
  });
}

export async function navigate() {
  cleanupAllRequests();

  let route = location.pathname.slice(1) as AppState;

  const isAuthRoute = [
    "sign-in",
    "sign-up",
    "verify-email",
    "forgot-password",
    "reset-password-email-sent",
    "reset-password",
    "reset-password-success",
  ].includes(route);

  if (isAuthRoute) {
    clearAllScrollStorage();
    cleanupWindowScrollManager();
  }

  const isGoogleCallback = route === "auth/google/callback";

  if (isGoogleCallback) {
    googleAuthCallback();
    return;
  }

  if (location.search) {
    const isAllowedResetPassword = route === "reset-password";

    const searchParams = new URLSearchParams(location.search);
    const sourceParam = searchParams.get("source");

    const validVerifySources = ["signup", "signin", "profile"];
    const validForgotSources = ["signin", "profile", "delete_form"];

    const isAllowedVerifyEmail =
      route === "verify-email" &&
      sourceParam !== null &&
      validVerifySources.includes(sourceParam);

    const isAllowedForgotPassword =
      route === "forgot-password" &&
      sourceParam !== null &&
      validForgotSources.includes(sourceParam);

    if (
      !isAllowedResetPassword &&
      !isAllowedForgotPassword &&
      !isAllowedVerifyEmail
    ) {
      setAppState("not-found");
      return;
    }
  }

  if (route === "") {
    history.replaceState({}, "", "/home");
    route = "home";
  }

  if (route === "verify-email") {
    const pendingEmail = authStore.getPendingVerificationEmail();

    if (pendingEmail === "<your-email@example.com>") {
      const searchParams = new URLSearchParams(location.search);
      const sourceParam = searchParams.get("source");

      const fallbackRoute = sourceParam === "profile" ? "profile" : "sign-up";

      history.replaceState({}, "", `/${fallbackRoute}`);
      route = fallbackRoute;
    }
  }

  if (
    route === "reset-password-email-sent" &&
    authStore.getPendingPasswordResetEmail() === "<your-email@example.com>"
  ) {
    history.replaceState({}, "", "/sign-in");
    route = "sign-in";
  }

  if (
    route === "reset-password-success" &&
    authStore.getIsPasswordResetSuccessful() === false
  ) {
    history.replaceState({}, "", "/sign-in");
    route = "sign-in";
  }

  if (route === "discover") {
    history.replaceState({}, "", "/movies");
    route = "movies";
  }

  if (
    route === "profile" &&
    window.__AUTH_STATE__.isUserAuthenticated === false
  ) {
    history.replaceState({}, "", "/home");
    route = "home";
  }

  const isMediaDetailsPage = route.match(/(tv|movie)\/(.+-)?([0-9]+)$/i);

  if (isMediaDetailsPage) {
    const mediaType = isMediaDetailsPage[1];
    const currentTitleSlug = (isMediaDetailsPage[2] || "").replace(/-$/, "");
    const tmdbId = isMediaDetailsPage[3];
    route = "details";
    setAppState("details");

    initHeaderScroll();

    await renderDetails(mediaType, currentTitleSlug, tmdbId);

    return;
  }

  const validAppStates: AppState[] = [
    "sign-in",
    "sign-up",
    "verify-email",
    "forgot-password",
    "reset-password-email-sent",
    "reset-password",
    "reset-password-success",
    "home",
    "discover",
    "movies",
    "tv-shows",
    "search",
    "watchlist",
    "watchlist-movies",
    "watchlist-tv-shows",
    "profile",
  ];

  if (validAppStates.includes(route)) {
    if (route === "reset-password") {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        history.replaceState({}, "", "/sign-in");
        route = "sign-in";
      }
    }

    setAppState(route);

    if (route === "sign-in") {
      initSignIn();
      googleAuth();
      togglePasswordVisibilty();
    } else if (route === "sign-up") {
      initSignUp();
      googleAuth();
      togglePasswordVisibilty();
    } else if (route === "verify-email") {
      initEmailVerification(authStore.getPendingVerificationEmail());
    } else if (route === "forgot-password") {
      initForgotPassword();
    } else if (route === "reset-password-email-sent") {
      initResetPasswordEmailSent(
        authStore.getPendingPasswordResetEmail() ?? "",
      );
    } else if (route === "reset-password") {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get("token")!;
      const email = searchParams.get("email")!;

      initResetPassword(token, email);
      togglePasswordVisibilty();
    } else if (route === "home" || route === "movies" || route === "tv-shows") {
      initWindowScrollManager();
      initFeatured();
      initShelves();
      restoreVerticalScroll(route);
      initHeaderScroll();
      profileDropdown();
      initSignOut();
    } else if (route === "search") {
      initWindowScrollManager();
      initSearchInput();
      restoreVerticalScroll(route);
      initHeaderScroll();
      profileDropdown();
      initSignOut();
    } else if (
      route === "watchlist" ||
      route === "watchlist-movies" ||
      route === "watchlist-tv-shows"
    ) {
      initWindowScrollManager();
      initWatchlist();
      restoreVerticalScroll(route);
      initHeaderScroll();
      profileDropdown();
      initSignOut();
    } else if (route === "profile") {
      initProfile();
      initEditAvatar();
      initEditIdentity();
      initEditEmail();
      initPasswordCard();
      googleAuth();
      initSignOut();
      initDeleteAccount();
    }
  } else setAppState("not-found");
}
