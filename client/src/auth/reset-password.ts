import { apiRequest } from "../api/api-request.js";
import { mockApiResponse } from "../api/mock-api.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { setAppState } from "../state/app.js";
import { authStore } from "../state/auth-store.js";
import type {
  ResetPasswordResponse,
  ResetPasswordValidationResponse,
} from "../types/api-response.js";
import type { FormValidationResult } from "../types/form-validation-result.js";
import { getElement } from "../utils/dom.js";
import { setFieldErrorStatus } from "../utils/form-ui.js";
import {
  validateConfirmPassword,
  validatePassword,
} from "../utils/form-validation.js";
import { isApiError } from "../utils/is-api-error.js";
import { showPageError } from "../utils/show-page-error.js";
import { resetForm } from "./reset-form.js";

let resetPasswordController: AbortController | null = null;

export async function initResetPassword(token: string, email: string) {
  resetForm();

  const passwordInput = getElement<HTMLInputElement>(
    "[data-js='reset-password']",
  );
  const passwordInputErrorElement = getElement<HTMLSpanElement>(
    "[data-js='reset-password-error']",
  );
  let passwordValidation: FormValidationResult = {
    message: "",
    isValid: false,
  };
  let isPasswordValid = false;

  const confirmPasswordInput = getElement<HTMLInputElement>(
    "[data-js='reset-confirm-password']",
  );
  const confirmPasswordInputErrorElement = getElement<HTMLSpanElement>(
    "[data-js='reset-confirm-password-error']",
  );
  let confirmPasswordValidation: FormValidationResult = {
    message: "",
    isValid: false,
  };
  let isConfirmPasswordValid = false;

  const submitBtn = getElement<HTMLButtonElement>(
    "[data-js='reset-password-btn']",
  );

  resetPasswordController?.abort();
  resetPasswordController = new AbortController();
  const signal = resetPasswordController.signal;

  try {
    const resetData = {
      token,
      email,
    };

    await apiRequest<ResetPasswordValidationResponse>(
      `${API_BASE_URL}/${API_ENDPOINTS.RESET_PASSWORD}/validate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resetData),
        signal,
      },
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") return;

    if (
      isApiError(error) &&
      (error.code === "INVALID_RESET_LINK" ||
        error.code === "RESET_LINK_EXPIRED")
    ) {
      showPageError("reset-password-page-expired");
      return;
    }

    showPageError("reset-password-page");
    return;
  }

  function checkFormValidity() {
    submitBtn.disabled = !(isPasswordValid && isConfirmPasswordValid);
  }

  passwordInput.addEventListener(
    "input",
    (e) => {
      passwordInput.value = (e.target as HTMLInputElement).value.replace(
        /\s/g,
        "",
      );
      setFieldErrorStatus(passwordInputErrorElement, "", passwordInput);

      passwordValidation = validatePassword(passwordInput.value);
      isPasswordValid = passwordValidation.isValid;

      if (confirmPasswordInput.value.length > 0) {
        if (passwordInput.value === confirmPasswordInput.value) {
          setFieldErrorStatus(
            confirmPasswordInputErrorElement,
            "",
            confirmPasswordInput,
          );
          confirmPasswordValidation = { message: "", isValid: true };
          isConfirmPasswordValid = confirmPasswordValidation.isValid;
        }
      }

      checkFormValidity();
    },
    { signal },
  );

  passwordInput.addEventListener(
    "blur",
    () => {
      setFieldErrorStatus(
        passwordInputErrorElement,
        passwordValidation.message,
        passwordInput,
      );
    },
    { signal },
  );

  confirmPasswordInput.addEventListener(
    "input",
    (e) => {
      confirmPasswordInput.value = (e.target as HTMLInputElement).value.replace(
        /\s/g,
        "",
      );
      setFieldErrorStatus(
        confirmPasswordInputErrorElement,
        "",
        confirmPasswordInput,
      );

      confirmPasswordValidation = validateConfirmPassword(
        passwordInput.value,
        confirmPasswordInput.value,
      );
      isConfirmPasswordValid = confirmPasswordValidation.isValid;

      checkFormValidity();
    },
    { signal },
  );

  confirmPasswordInput.addEventListener(
    "blur",
    () => {
      setFieldErrorStatus(
        confirmPasswordInputErrorElement,
        confirmPasswordValidation.message,
        confirmPasswordInput,
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

      const resetData = {
        token,
        email,
        password: passwordInput.value,
        confirmPassword: confirmPasswordInput.value,
      };

      try {
        const response = await apiRequest<ResetPasswordResponse>(
          `${API_BASE_URL}/${API_ENDPOINTS.RESET_PASSWORD}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(resetData),
            signal,
          },
        );

        if (response.success) {
          authStore.setIsPasswordResetSuccessful(true);
          history.replaceState({}, "", "/reset-password-success");
          navigate();
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;

        console.error("Failed to reset password:", error);

        submitBtn.setAttribute("data-loading", "false");
        submitBtn.disabled = false;

        if (isApiError(error)) {
          if (error.status === 400 || error.status === 409) {
            if (
              error.code === "INVALID_RESET_LINK" ||
              error.code === "RESET_LINK_EXPIRED"
            ) {
              showPageError("reset-password-page-expired");
              return;
            }

            const targetInputName = error.targetInput;
            const message = error.message;

            const targetInput = getElement<HTMLInputElement>(
              `[data-js=reset-${targetInputName}]`,
            );
            const targetInputError = getElement<HTMLSpanElement>(
              `[data-js=reset-${targetInputName}-error]`,
            );

            if (targetInput && targetInputError) {
              setFieldErrorStatus(targetInputError, message, targetInput);

              switch (targetInputName) {
                case "password":
                  isPasswordValid = false;
                  passwordValidation = { message, isValid: false };
                  break;
                case "confirm-password":
                  isConfirmPasswordValid = false;
                  confirmPasswordValidation = { message, isValid: false };
                  break;
              }

              targetInput.focus();
              checkFormValidity();
            } else {
              showPageError("reset-password-page");
            }
          } else if (error.status === 404) {
            setAppState("not-found");
          } else {
            showPageError("reset-password-page");
          }
        } else {
          showPageError("reset-password-page");
        }
      }
    },
    { signal },
  );
}

export function cleanupResetPassword() {
  resetPasswordController?.abort();
  resetPasswordController = null;
}
