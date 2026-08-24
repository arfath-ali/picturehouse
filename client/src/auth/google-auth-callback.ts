import { showNotice } from "../components/show-notice.js";
import { initProfile } from "../profile/init.js";
import { navigate } from "../router/navigate.js";
import { clearAllScrollStorage } from "../scroll/window.js";
import {
  notifySessionChanged,
  notifySessionTerminated,
} from "../utils/auth-channel.js";
import { handleGoogleAuthErrors } from "./google-auth-errors.js";
import { initHeaderAuthUI } from "./header-auth-ui.js";

export function googleAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const status = params.get("status");
  const userId = params.get("user_id");
  const errorCode = params.get("code");

  const redirectAndNavigate = (targetPath: string) => {
    history.replaceState({}, "", targetPath);
    navigate();
  };

  if (mode === "signin" && status === "success" && userId) {
    notifySessionChanged(userId);
    clearAllScrollStorage();
    initHeaderAuthUI();
    redirectAndNavigate("/home");
    return;
  }

  if (mode === "link-account" && status === "success" && userId) {
    window.__AUTH_STATE__.isGoogleUser = true;
    redirectAndNavigate("/profile");
    showNotice({
      message: "Google account linked successfully.",
      type: "success",
    });
    return;
  }

  if (mode === "unlink-account" && status === "success" && userId) {
    window.__AUTH_STATE__.isGoogleUser = false;
    redirectAndNavigate("/profile");
    showNotice({
      message: "Google account unlinked successfully.",
      type: "success",
    });
    return;
  }

  if (status === "deleted" && userId) {
    notifySessionTerminated();
    initHeaderAuthUI();
    redirectAndNavigate("/sign-in");
    showNotice({
      message: "Your account has been deleted successfully.",
      type: "info",
    });
    return;
  }

  if (status === "error" || errorCode) {
    const handled = handleGoogleAuthErrors(
      mode,
      errorCode,
      redirectAndNavigate,
    );
    if (handled) return;
  }

  redirectAndNavigate("/sign-in");
}
