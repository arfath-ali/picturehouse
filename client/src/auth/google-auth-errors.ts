import { showNotice } from "../components/show-notice.js";
import { clearAllScrollStorage } from "../scroll/window.js";
import { notifySessionTerminated } from "../utils/auth-channel.js";
import { resetAuthState } from "../utils/auth-state.js";
import { reopenDeleteAccountModal } from "./delete-account.js";
import { initHeaderAuthUI } from "./header-auth-ui.js";

export function handleGoogleAuthErrors(
  mode: string | null,
  errorCode: string | null,
  redirectAndNavigate: (route: string) => void,
) {
  let errorMessage = "Google authentication failed. Please try again.";

  switch (errorCode) {
    case "access_denied":
      errorMessage = "Google sign-in was canceled or access was denied.";
      break;

    case "PASSWORD_REQUIRED":
      errorMessage =
        "Please set an account password before unlinking your Google account.";
      break;

    case "GOOGLE_ACCOUNT_ALREADY_LINKED":
      errorMessage = "This Google account is already linked.";
      break;

    case "GOOGLE_ACCOUNT_MISMATCH":
      errorMessage =
        "The Google account selected does not match your active account.";
      break;

    case "USER_NOT_FOUND":
      if (mode === "signin") {
        errorMessage = "No registered account found with this Google profile.";
      } else if (mode === "link-account" || mode === "unlink-account") {
        errorMessage = "User account not found. Please sign in again.";
      } else {
        errorMessage = "User account not found.";
      }
      break;

    case "SESSION_EXPIRED":
      errorMessage =
        mode === "delete"
          ? "This account no longer exists or was already deleted."
          : "Your session has expired. Please sign in again.";
      break;

    case "GOOGLE_AUTH_FAILED":
      if (mode === "delete") {
        errorMessage = "Google account verification was canceled or failed.";
      } else if (mode === "link-account") {
        errorMessage = "Google account linking was canceled or failed.";
      } else if (mode === "unlink-account") {
        errorMessage = "Google account unlinking was canceled or failed.";
      } else {
        errorMessage = "Google sign-in was canceled or failed.";
      }
      break;

    case "SERVER_CONFIG_ERROR":
      errorMessage =
        "Authentication is temporarily unavailable. Please try again later.";
      break;

    default:
      if (mode === "delete") {
        errorMessage = "Failed to delete account via Google. Please try again.";
      } else if (mode === "link-account") {
        errorMessage = "Failed to link Google account. Please try again.";
      } else if (mode === "unlink-account") {
        errorMessage = "Failed to unlink Google account. Please try again.";
      } else {
        errorMessage = "Failed to sign in with Google. Please try again.";
      }
      break;
  }

  if (errorCode === "USER_NOT_FOUND") {
    resetAuthState();
    notifySessionTerminated();
    clearAllScrollStorage();
    initHeaderAuthUI();
    redirectAndNavigate("/sign-in");
  } else if (mode === "delete") {
    redirectAndNavigate("/profile");
    reopenDeleteAccountModal();
  } else if (mode === "link-account" || mode === "unlink-account") {
    redirectAndNavigate("/profile");
  } else {
    redirectAndNavigate("/sign-in");
  }

  showNotice({
    message: errorMessage,
    type: "error",
  });

  return true;
}
