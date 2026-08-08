import { apiRequest } from "../api/api-request.js";
import { mockApiResponse } from "../api/mock-api.js";
import { showNotice } from "../components/show-notice.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { clearAllScrollStorage } from "../scroll/window.js";
import { setAppState } from "../state/app.js";
import type { SignOutResponse } from "../types/api-response.js";
import { notifySessionChanged } from "../utils/auth-channel.js";
import { getElement, getElements } from "../utils/dom.js";
import { isApiError } from "../utils/is-api-error.js";
import { initHeaderAuthUI } from "./header-auth-ui.js";

let signOutController: AbortController | null = null;

export function initSignOut() {
  const signOutBtns = getElements<HTMLButtonElement>("[data-js='signout-btn']");
  const profielMenu = getElement("[data-js='site-header-profile-menu']");

  signOutController?.abort();
  signOutController = new AbortController();
  const signal = signOutController.signal;

  signOutBtns.forEach((signOutBtn) => {
    signOutBtn.addEventListener(
      "click",
      async () => {
        const header = getElement<HTMLElement>(".site-header");
        const currentUserId = window.__AUTH_STATE__.userId;

        profielMenu.classList.remove("is-visible");
        signOutBtn.disabled = true;
        signOutBtn.setAttribute("data-loading", "true");
        document.body.classList.add("is-signing-out");

        try {
          const response = await apiRequest<SignOutResponse>(
            `${API_BASE_URL}/${API_ENDPOINTS.SIGNOUT}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              signal,
            },
          );

          if (response.success) {
            window.__AUTH_STATE__.isUserAuthenticated = false;
            notifySessionChanged(currentUserId);
            clearAllScrollStorage();
            initHeaderAuthUI();
            header.classList.add("is-hidden");
            history.pushState({}, "", "/sign-in");
            navigate();
            showNotice({
              message: "You have been signed out successfully.",
              type: "info",
            });
          }
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }

          console.error(error);

          if (isApiError(error)) {
            if (error.status === 404) {
              setAppState("not-found");
              return;
            }

            if (error.status === 401) {
              window.__AUTH_STATE__.isUserAuthenticated = false;
              notifySessionChanged(currentUserId);
              clearAllScrollStorage();
              initHeaderAuthUI();
              header.classList.add("is-hidden");
              history.pushState({}, "", "/sign-in");
              navigate();
              return;
            }
          }

          showNotice({
            message: "Failed to sign out. Please try again.",
            type: "error",
          });
        } finally {
          document.body.classList.remove("is-signing-out");
          signOutBtn.setAttribute("data-loading", "false");
          signOutBtn.disabled = false;
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
