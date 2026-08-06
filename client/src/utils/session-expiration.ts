import { initHeaderAuthUI } from "../auth/header-auth-ui.js";
import { showNotice } from "../components/show-notice.js";

export function handleSessionExpiration() {
  window.__AUTH_STATE__.isUserAuthenticated = false;

  initHeaderAuthUI();

  showNotice({
    message: "Your session has expired. Please sign in again.",
    type: "error",
  });
}
