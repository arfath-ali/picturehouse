import { cleanupDeleteAccountController } from "../auth/delete-account.js";
import { cleanupForgotPassword } from "../auth/forgot-password.js";
import { cleanupGoogleAuth } from "../auth/google-auth.js";
import { cleanupResetPasswordEmailSent } from "../auth/reset-password-email-sent.js";
import { cleanupResetPassword } from "../auth/reset-password.js";
import { cleanupSignInController } from "../auth/sign-in.js";
import { cleanupSignOutController } from "../auth/sign-out.js";
import { cleanupSignUpController } from "../auth/sign-up.js";
import { cleanupEmailVerification } from "../auth/verify-email.js";
import { cleanupProfileDropdown } from "../components/profile-dropdown.js";
import { cleanupShowNotice } from "../components/show-notice.js";
import { cleanupDetailsRequest } from "../features/media-details.js";
import { cleanupFeaturedRequest } from "../features/media-featured.js";
import { cleanupShelfRequest } from "../features/media-shelf.js";
import { cleanupSearchRequest } from "../init/search-input.js";
import { cleanupIdentityEdit } from "../profile/edit-identity.js";
import { cleanupPasswordCard } from "../profile/password-card.js";
import { cleanupProfile } from "../profile/init.js";
import { cleanupDetailsScroll } from "../scroll/media-details.js";
import { cleanupFeaturedScroll } from "../scroll/media-featured.js";
import { cleanupShelfScroll } from "../scroll/media-shelf.js";
import { cleanupWatchlistRequest } from "../watchlist/render.js";
import { cleanupWatchlistSearch } from "../watchlist/search.js";
import { cleanupWatchlistSort } from "../watchlist/sort.js";
import { cleanupWatchlistState } from "../watchlist/state.js";
import { cleanupUsernameVerification } from "./check-username-availability.js";
import { cleanupOtpInputs } from "./otp.js";
import { cleanupPasswordVisibility } from "./password-visibility.js";
import { cleanupPasswordEdit } from "../profile/edit-password.js";
import { cleanupEmailEdit } from "../profile/edit-email.js";
import { cleanupAvatarEdit } from "../profile/edit-avatar.js";
import { cleanupUserSession } from "../auth/user-session.js";

export function cleanupAllRequests() {
  cleanupUserSession();

  cleanupGoogleAuth();
  cleanupSignInController();
  cleanupSignOutController();
  cleanupForgotPassword();
  cleanupResetPasswordEmailSent();
  cleanupResetPassword();
  cleanupSignUpController();
  cleanupUsernameVerification();
  cleanupEmailVerification();
  cleanupDeleteAccountController();

  cleanupPasswordVisibility();
  cleanupOtpInputs();

  cleanupProfile();
  cleanupAvatarEdit();
  cleanupIdentityEdit();
  cleanupPasswordCard();
  cleanupEmailEdit();
  cleanupPasswordEdit();

  cleanupFeaturedRequest();
  cleanupShelfRequest();
  cleanupDetailsRequest();
  cleanupSearchRequest();
  cleanupWatchlistRequest();

  cleanupProfileDropdown();

  cleanupFeaturedScroll();
  cleanupShelfScroll();
  cleanupDetailsScroll();

  cleanupWatchlistState();
  cleanupWatchlistSearch();
  cleanupWatchlistSort();

  cleanupShowNotice();
}
