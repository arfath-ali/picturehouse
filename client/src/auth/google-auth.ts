import { apiRequest } from "../api/api-request.js";
import { showNotice } from "../components/show-notice.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import type { GoogleAuthResponse } from "../types/api-response.js";
import { getElements } from "../utils/dom.js";

let googleAuthController: AbortController | null = null;

export function googleAuth() {
  const googleAuthBtns = getElements<HTMLButtonElement>(
    "[data-js='google-auth-btn'], [data-js='google-auth-btn-connect']",
  );

  googleAuthController?.abort();
  googleAuthController = new AbortController();
  const signal = googleAuthController.signal;

  for (const authBtn of googleAuthBtns) {
    const mode = authBtn.dataset.mode;
    authBtn.addEventListener(
      "click",
      async () => {
        if (mode === "unlink-account") {
          if (!window.__AUTH_STATE__?.hasPassword) {
            showNotice({
              message:
                "Please set up a password before unlinking your Google account.",
              type: "info",
            });
            return;
          }
        }

        try {
          const response = await apiRequest<GoogleAuthResponse>(
            `${API_BASE_URL}/${API_ENDPOINTS.GOOGLE_AUTH}?mode=${mode}`,
            { method: "GET" },
          );

          if (response.success) {
            window.location.href = response.googleConsentURL;
          }
        } catch (error: unknown) {
          console.error(error);

          const message =
            mode === "delete"
              ? "Unable to initiate Google account verification."
              : mode === "link-account"
                ? "Unable to initiate Google account linking. Please try again."
                : mode === "unlink-account"
                  ? "Unable to initiate Google account unlinking. Please try again."
                  : "Unable to initiate Google sign-in. Please try again.";

          showNotice({ message, type: "error" });

          return;
        }
      },
      { signal },
    );
  }
}

export function cleanupGoogleAuth() {
  googleAuthController?.abort();
  googleAuthController = null;
}
