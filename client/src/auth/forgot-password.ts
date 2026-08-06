import { apiRequest } from "../api/api-request.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { setAppState } from "../state/app.js";
import { authStore } from "../state/auth-store.js";
import type {
  ForgotPasswordResponse,
  SignUpResponse,
} from "../types/api-response.js";
import type { FormValidationResult } from "../types/form-validation-result.js";
import { getElement } from "../utils/dom.js";
import { setFieldErrorStatus } from "../utils/form-ui.js";
import { validateEmail } from "../utils/form-validation.js";
import { isApiError } from "../utils/is-api-error.js";
import { showPageError } from "../utils/show-page-error.js";
import { resetForm } from "./reset-form.js";

let forgotPasswordController: AbortController | null = null;

export function initForgotPassword() {
  resetForm();

  const emailInput = getElement<HTMLInputElement>(
    "[data-js='forgot-password-email'",
  );
  const emailInputErrorElement = getElement<HTMLSpanElement>(
    "[data-js='forgot-password-email-error']",
  );
  let emailValidation: FormValidationResult = {
    message: "",
    isValid: false,
  };
  let isEmailValid: boolean = false;

  const submitBtn = getElement<HTMLButtonElement>("[data-js='reset-link-btn']");

  forgotPasswordController?.abort();
  forgotPasswordController = new AbortController();
  const signal = forgotPasswordController.signal;

  function checkFormValidity() {
    submitBtn.disabled = !isEmailValid;
  }

  emailInput.addEventListener(
    "input",
    () => {
      const currentEmail = emailInput.value.trim();

      setFieldErrorStatus(emailInputErrorElement, "", emailInput);
      emailValidation = validateEmail(currentEmail);
      isEmailValid = emailValidation.isValid;

      checkFormValidity();
    },
    { signal },
  );

  emailInput.addEventListener(
    "blur",
    () => {
      setFieldErrorStatus(
        emailInputErrorElement,
        emailValidation.message,
        emailInput,
      );
    },
    { signal },
  );

  submitBtn.addEventListener(
    "click",
    async (e) => {
      e.preventDefault();

      submitBtn.setAttribute("data-loading", "true");
      submitBtn.disabled = true;

      try {
        const response = await apiRequest<ForgotPasswordResponse>(
          `${API_BASE_URL}/${API_ENDPOINTS.FORGOT_PASSWORD}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: emailInput.value }),
          },
        );

        if (response.success) {
          authStore.setPendingPasswordResetEmail(emailInput.value);
          history.replaceState({}, "", "/reset-password-email-sent");
          navigate();
        }
      } catch (error: unknown) {
        console.error(error);

        submitBtn.setAttribute("data-loading", "false");
        submitBtn.disabled = false;

        if (isApiError(error)) {
          if (error.status === 400 || error.status === 409) {
            const message = error.message;

            setFieldErrorStatus(emailInputErrorElement, message, emailInput);

            isEmailValid = false;
            emailValidation = { message, isValid: false };

            emailInput.focus();
            checkFormValidity();
          } else if (error.status === 404) {
            setAppState("not-found");
          } else {
            showPageError("forgot-password-page");
          }
        } else {
          showPageError("forgot-password-page");
        }
      }
    },
    { signal },
  );
}

export function cleanupForgotPassword() {
  forgotPasswordController?.abort();
  forgotPasswordController = null;
}
