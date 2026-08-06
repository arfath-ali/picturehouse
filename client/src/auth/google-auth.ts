import { apiRequest } from "../api/api-request.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { setAppState } from "../state/app.js";
import type { GoogleAuthResponse } from "../types/api-response.js";
import { getElements } from "../utils/dom.js";
import { isApiError } from "../utils/is-api-error.js";
import { showPageError } from "../utils/show-page-error.js";

let googleAuthController: AbortController | null = null;

export function googleAuth() {
  const googleAuthBtns = getElements<HTMLButtonElement>(
    "[data-js='google-auth-btn']",
  );

  googleAuthController?.abort();
  googleAuthController = new AbortController();
  const signal = googleAuthController.signal;

  for (const authBtn of googleAuthBtns) {
    const mode = authBtn.dataset.mode;
    authBtn.addEventListener(
      "click",
      async () => {
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

          if (isApiError(error)) {
            if (error.status === 404) {
              setAppState("not-found");
              return;
            }

            if (error.status === 400) return;
          }
          showPageError("signin-page");
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
