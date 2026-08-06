import { apiRequest } from "../api/api-request.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { setAppState } from "../state/app.js";
import type { CheckUsernameResponse } from "../types/api-response.js";
import type { FormValidationResult } from "../types/form-validation-result.js";
import { getElement } from "./dom.js";
import { isApiError } from "./is-api-error.js";
import { showPageError } from "./show-page-error.js";

let usernameController: AbortController | null = null;
let debounceTimer: number | null = null;

export function clearUsernameDebounce() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (usernameController) {
    usernameController.abort();
    usernameController = null;
  }

  const usernameInputRow = getElement("[data-js='signup-username-row']");
  usernameInputRow.setAttribute("data-status", "idle");
}

export function checkUsernameAvailability(
  username: string,
): Promise<FormValidationResult> {
  return new Promise((resolve) => {
    const usernameInputRow = getElement("[data-js='signup-username-row']");
    usernameInputRow.setAttribute("data-status", "loading");
    debounceTimer = window.setTimeout(async () => {
      const validation: FormValidationResult = {
        message: "",
        isValid: false,
      };

      usernameController = new AbortController();
      const signal = usernameController.signal;

      try {
        const response = await apiRequest<CheckUsernameResponse>(
          `${API_BASE_URL}/${API_ENDPOINTS.USERNAME(username)}`,
          {
            method: "GET",
            signal,
          },
        );
        validation.isValid = response.success;
        usernameInputRow.setAttribute("data-status", "valid");
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error(error);

        usernameInputRow.setAttribute("data-status", "invalid");

        if (isApiError(error)) {
          if (error.status === 409) {
            validation.message = error.message;
            validation.status = error.status;
          } else {
            setAppState("not-found");
          }
        } else {
          showPageError("signup-page");
        }
      } finally {
        usernameController = null;
      }
      resolve(validation);
    }, 500);
  });
}

export function resetUsernameStatus() {
  const usernameInputRow = getElement("[data-js='signup-username-row']");
  usernameInputRow.setAttribute("data-status", "idle");
}

export function cleanupUsernameVerification() {
  usernameController?.abort();
  usernameController = null;
}
