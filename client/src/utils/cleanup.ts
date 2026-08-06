import { cleanupForgotPassword } from "../auth/forgot-password.js";
import { cleanupGoogleAuth } from "../auth/google-auth.js";
import { cleanupResetPasswordEmailSent } from "../auth/reset-password-email-sent.js";
import { cleanupResetPassword } from "../auth/reset-password.js";
import { cleanupSignInController } from "../auth/sign-in.js";
import { cleanupSignUpController } from "../auth/sign-up.js";
import { cleanupEmailVerification } from "../auth/verify-email.js";
import { cleanupShowNotice } from "../components/show-notice.js";
import { cleanupDetailsRequest } from "../features/media-details.js";
import { cleanupFeaturedRequest } from "../features/media-featured.js";
import { cleanupShelfRequest } from "../features/media-shelf.js";
import { cleanupSearchRequest } from "../init/search-input.js";
import { cleanupDetailsScroll } from "../scroll/media-details.js";
import { cleanupFeaturedScroll } from "../scroll/media-featured.js";
import { cleanupShelfScroll } from "../scroll/media-shelf.js";
import { cleanupWindowScrollManager } from "../scroll/window.js";
import { cleanupWatchlistRequest } from "../watchlist/render.js";
import { cleanupWatchlistSearch } from "../watchlist/search.js";
import { cleanupWatchlistSort } from "../watchlist/sort.js";
import { cleanupWatchlistState } from "../watchlist/state.js";
import { cleanupUsernameVerification } from "./check-username-availability.js";
import { cleanupOtpInputs } from "./otp.js";
import { cleanupPasswordVisibility } from "./password-visibility.js";

export function cleanupAllRequests() {
  cleanupGoogleAuth();
  cleanupSignInController();
  cleanupForgotPassword();
  cleanupResetPasswordEmailSent();
  cleanupResetPassword();
  cleanupSignUpController();
  cleanupUsernameVerification();
  cleanupEmailVerification();

  cleanupFeaturedRequest();
  cleanupShelfRequest();
  cleanupDetailsRequest();
  cleanupSearchRequest();
  cleanupWatchlistRequest();

  cleanupPasswordVisibility();
  cleanupOtpInputs();

  cleanupFeaturedScroll();
  cleanupShelfScroll();
  cleanupDetailsScroll();

  cleanupWatchlistState();
  cleanupWatchlistSearch();
  cleanupWatchlistSort();

  cleanupShowNotice();
}
