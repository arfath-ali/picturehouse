import { apiRequest } from "../api/api-request.js";
import { showNotice } from "../components/show-notice.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { clearAllScrollStorage } from "../scroll/window.js";
import { setAppState } from "../state/app.js";
import type { SignOutResponse } from "../types/api-response.js";
import {
  notifySessionChanged,
  notifySessionTerminated,
} from "../utils/auth-channel.js";
import { resetAuthState } from "../utils/auth-state.js";
import { getElement, getElements } from "../utils/dom.js";
import { isApiError } from "../utils/is-api-error.js";
import { initWatchlistState } from "../watchlist/state.js";
import { initHeaderAuthUI } from "./header-auth-ui.js";

let signOutController: AbortController | null = null;

export function initSignOut() {
  const signOutBtns = getElements<HTMLButtonElement>("[data-js='signout-btn']");
  const profileMenu = getElement("[data-js='site-header-profile-menu']");

  signOutController?.abort();
  signOutController = new AbortController();
  const signal = signOutController.signal;

  signOutBtns.forEach((signOutBtn) => {
    signOutBtn.addEventListener(
      "click",
      async () => {
        const header = getElement<HTMLElement>(".site-header");
        const signoutType = signOutBtn.dataset.signoutType;

        signOutBtn.disabled = true;
        signOutBtn.setAttribute("data-loading", "true");
        document.body.classList.add("is-signing-out");

        const completeSignOut = async (noticeMessage: string) => {
          resetAuthState();
          notifySessionTerminated();
          clearAllScrollStorage();
          initHeaderAuthUI();
          initWatchlistState();
          header.classList.add("is-hidden");
          history.pushState({}, "", "/sign-in");
          await navigate();
          document.body.classList.remove("is-signing-out");
          showNotice({
            message: noticeMessage,
            type: "info",
          });
        };

        const resetBtnState = () => {
          document.body.classList.remove("is-signing-out");
          signOutBtn.setAttribute("data-loading", "false");
          signOutBtn.disabled = false;
        };

        try {
          await new Promise((resolve) => setTimeout(resolve, 5000));

          const response = await apiRequest<SignOutResponse>(
            `${API_BASE_URL}/${API_ENDPOINTS.SIGNOUT}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ signoutType }),
            },
          );

          if (response.success) {
            await completeSignOut("You have been signed out successfully.");
            return;
          }

          resetBtnState();
          showNotice({
            message: "Failed to sign out. Please try again.",
            type: "error",
          });
        } catch (error) {
          console.error(error);

          if (
            isApiError(error) &&
            (error.status === 401 || error.status === 404)
          ) {
            const message =
              error.status === 404
                ? "Session expired or already signed out."
                : "You have been signed out.";
            await completeSignOut(message);
            return;
          }

          resetBtnState();
          showNotice({
            message: "Failed to sign out. Please try again.",
            type: "error",
          });
        } finally {
          profileMenu.classList.remove("is-visible");
        }
      },
      { signal },
    );
  });
}

export function cleanupSignOutController() {
  signOutController?.abort();
  signOutController = null;
}
