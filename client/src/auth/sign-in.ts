import { apiRequest } from "../api/api-request.js";
import { mockApiResponse } from "../api/mock-api.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import {
  cleanupWindowScrollManager,
  clearAllScrollStorage,
  initWindowScrollManager,
} from "../scroll/window.js";
import { setAppState } from "../state/app.js";
import { authStore } from "../state/auth-store.js";
import type { SignInResponse } from "../types/api-response.js";
import { notifySessionChanged } from "../utils/auth-channel.js";
import { getElement } from "../utils/dom.js";
import { setFieldErrorStatus } from "../utils/form-ui.js";
import { isApiError } from "../utils/is-api-error.js";
import { showPageError } from "../utils/show-page-error.js";
import { initHeaderAuthUI } from "./header-auth-ui.js";
import { resetForm } from "./reset-form.js";

let signInController: AbortController | null = null;

export function initSignIn() {
  resetForm();

  const identifierInput = getElement<HTMLInputElement>(
    "[data-js='signin-identifier']",
  );
  const identifierInputErrorElement = getElement<HTMLSpanElement>(
    "[data-js='signin-identifier-error']",
  );
  let isIdentifierValid: boolean = false;

  const passwordInput = getElement<HTMLInputElement>(
    "[data-js='signin-password'",
  );
  const passwordInputErrorElement = getElement<HTMLSpanElement>(
    "[data-js='signin-password-error']",
  );
  let isPasswordValid: boolean = false;

  const signInFormError = getElement<HTMLSpanElement>(
    "[data-js='signin-form-error']",
  );

  const submitBtn = getElement<HTMLButtonElement>("[data-js='signin-btn']");

  signInController?.abort();
  signInController = new AbortController();
  const signal = signInController.signal;

  function checkFormValidity() {
    submitBtn.disabled = !(isIdentifierValid && isPasswordValid);
  }

  identifierInput.addEventListener(
    "input",
    (e) => {
      const value = (e.target as HTMLInputElement).value.trim();

      identifierInput.value = value.toLowerCase().replace(/\s/g, "");

      setFieldErrorStatus(signInFormError);
      setFieldErrorStatus(identifierInputErrorElement, "", identifierInput);

      isIdentifierValid = value !== "";

      if (passwordInput.value.trim()) {
        isPasswordValid = true;
      }

      checkFormValidity();
    },
    { signal },
  );

  passwordInput.addEventListener(
    "input",
    (e) => {
      const value = (e.target as HTMLInputElement).value.trim();

      setFieldErrorStatus(signInFormError);
      setFieldErrorStatus(passwordInputErrorElement, "", passwordInput);

      isPasswordValid = value !== "";

      if (identifierInput.value.trim()) {
        isIdentifierValid = true;
      }

      checkFormValidity();
    },
    { signal },
  );

  submitBtn.addEventListener(
    "click",
    async (e) => {
      e.preventDefault();

      submitBtn.setAttribute("data-loading", "true");
      submitBtn.disabled = true;

      const userData = {
        identifier: identifierInput.value,
        password: passwordInput.value,
      };

      try {
        const response = await apiRequest<SignInResponse>(
          `${API_BASE_URL}/${API_ENDPOINTS.SIGNIN}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          },
        );

        if (response.success) {
          if (!response.is_verified) {
            authStore.setPendingVerificationEmail(response.email);
            history.replaceState({}, "", "/verify-email");
          } else {
            window.__AUTH_STATE__.isUserAuthenticated = true;
            notifySessionChanged(response.user_id);
            clearAllScrollStorage();
            initHeaderAuthUI();
            history.replaceState({}, "", "/home");
          }
          navigate();
        }
      } catch (error: unknown) {
        console.error(error);

        submitBtn.setAttribute("data-loading", "false");
        submitBtn.disabled = false;

        if (isApiError(error)) {
          if (error.status === 400) {
            const targetInputName = error.targetInput;
            const message = error.message;

            const targetInput = getElement<HTMLInputElement>(
              `[data-js=signin-${targetInputName}]`,
            );
            const targetInputError = getElement<HTMLSpanElement>(
              `[data-js=signin-${targetInputName}-error]`,
            );

            setFieldErrorStatus(targetInputError, message, targetInput);

            switch (targetInputName) {
              case "identifier":
                isIdentifierValid = false;
                break;

              case "password":
                isPasswordValid = false;
                break;
            }

            targetInput.focus();
            checkFormValidity();
          } else if (error.status === 401) {
            setFieldErrorStatus(signInFormError, error.message);
            isIdentifierValid = false;
            isPasswordValid = false;
            identifierInput.focus();
            checkFormValidity();
          } else if (error.status === 404) {
            setAppState("not-found");
          } else {
            showPageError("signin-page");
          }
        } else {
          showPageError("signin-page");
        }
      }
    },
    { signal },
  );
}

export function cleanupSignInController() {
  signInController?.abort();
  signInController = null;
}
