import { checkUsername } from "../api/check-username.js";
import { setAppState } from "../state/app.js";
import type { FormValidationResult } from "../types/form-validation-result.js";
import { getElement } from "./dom.js";

let debounceTimer: number | null = null;

export function clearUsernameDebounce() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
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

      try {
        const response = await checkUsername(username);
        validation.isValid = response.success;
        usernameInputRow.setAttribute("data-status", "valid");
      } catch (error: any) {
        usernameInputRow.setAttribute("data-status", "invalid");
        if (error.status === 409) {
          validation.message = error.backendMessage;
          validation.status = error.status;
        } else {
          setAppState("not-found");
        }
      }
      resolve(validation);
    }, 500);
  });
}
