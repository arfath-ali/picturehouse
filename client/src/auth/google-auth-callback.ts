import { showNotice } from "../components/show-notice.js";
import { navigate } from "../router/navigate.js";
import {
  cleanupWindowScrollManager,
  clearAllScrollStorage,
  initWindowScrollManager,
} from "../scroll/window.js";
import { notifySessionChanged } from "../utils/auth-channel.js";
import { initHeaderAuthUI } from "./header-auth-ui.js";

export function googleAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const userId = params.get("user_id");
  const errorCode = params.get("code");

  const redirectAndNavigate = (targetPath: string) => {
    history.replaceState({}, "", targetPath);
    navigate();
  };

  if (status === "success" && userId) {
    window.__AUTH_STATE__.isUserAuthenticated = true;
    notifySessionChanged(userId);
    clearAllScrollStorage();
    initHeaderAuthUI();
    redirectAndNavigate("/home");
    return;
  }

  if (status === "deleted" && userId) {
    window.__AUTH_STATE__.isUserAuthenticated = false;
    notifySessionChanged(userId);
    initHeaderAuthUI();

    showNotice({
      message: "Your account has been deleted.",
      type: "info",
    });

    redirectAndNavigate("/sign-in");
    return;
  }

  if (status === "error" || errorCode) {
    let errorMessage = "Google authentication failed. Please try again.";

    if (errorCode === "USER_NOT_FOUND") {
      errorMessage = "No matching user account was found to delete.";
    } else if (errorCode === "GOOGLE_AUTH_FAILED") {
      errorMessage = "Google sign-in was canceled or failed.";
    } else if (errorCode === "SERVER_CONFIG_ERROR") {
      errorMessage = "Server authentication setup is incomplete.";
    }

    showNotice({
      message: errorMessage,
      type: "error",
    });

    redirectAndNavigate("/sign-in");
    return;
  }

  redirectAndNavigate("/sign-in");
}
