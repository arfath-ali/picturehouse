import { apiRequest } from "../api/api-request.js";
import { initHeaderAuthUI } from "../auth/header-auth-ui.js";
import { resetForm } from "../auth/reset-form.js";
import { showNotice } from "../components/show-notice.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { clearAllScrollStorage } from "../scroll/window.js";
import type { ProfilePasswordEditResponse } from "../types/api-response.js";
import type { FormValidationResult } from "../types/form-validation-result.js";
import { notifySessionTerminated } from "../utils/auth-channel.js";
import { resetAuthState } from "../utils/auth-state.js";
import { getElement } from "../utils/dom.js";
import { setFieldErrorStatus } from "../utils/form-ui.js";
import {
  validateConfirmPassword,
  validatePassword,
} from "../utils/form-validation.js";
import { isApiError } from "../utils/is-api-error.js";
import { initProfile } from "./init.js";
import { closeEditPasswordForm } from "./password-card.js";

let passwordEditController: AbortController | null = null;

export function initEditPassword() {
  const passwordEditBtn = getElement<HTMLButtonElement>(
    "[data-js='edit-password-btn']",
  );

  const currentPasswordField = getElement(
    "[data-js='password-edit-current-field']",
  );
  const currentPasswordInput = getElement<HTMLInputElement>(
    "[data-js='profile-current-password']",
  );
  const currentPasswordInputError = getElement<HTMLSpanElement>(
    "[data-js='profile-current-password-error']",
  );
  let currentPasswordValidation: FormValidationResult = {
    message: "",
    isValid: false,
  };

  let isCurrentPasswordValid: boolean = false;

  const newPasswordInput = getElement<HTMLInputElement>(
    "[data-js='profile-new-password']",
  );
  const newPasswordInputError = getElement<HTMLSpanElement>(
    "[data-js='profile-new-password-error']",
  );
  let newPasswordValidation: FormValidationResult = {
    message: "",
    isValid: false,
  };

  let isNewPasswordValid: boolean = false;

  const confirmPasswordInput = getElement<HTMLInputElement>(
    "[data-js='profile-confirm-password']",
  );
  const confirmPasswordInputError = getElement<HTMLSpanElement>(
    "[data-js='profile-confirm-password-error']",
  );
  let confirmPasswordValidation: FormValidationResult = {
    message: "",
    isValid: false,
  };

  let isConfirmPasswordValid: boolean = false;

  const submitBtn = getElement<HTMLButtonElement>(
    "[data-js='edit-password-save-btn']",
  );

  passwordEditController?.abort();
  passwordEditController = new AbortController();
  const signal = passwordEditController.signal;

  function checkFormValidity() {
    if (window.__AUTH_STATE__?.hasPassword) {
      submitBtn.disabled = !(
        isCurrentPasswordValid &&
        isNewPasswordValid &&
        isConfirmPasswordValid
      );
    } else {
      submitBtn.disabled = !(isNewPasswordValid && isConfirmPasswordValid);
    }
  }

  currentPasswordInput.addEventListener(
    "input",
    (e) => {
      const value = (e.target as HTMLInputElement).value.trim();

      setFieldErrorStatus(currentPasswordInputError, "", currentPasswordInput);

      isCurrentPasswordValid = value !== "";

      checkFormValidity();
    },
    { signal },
  );

  newPasswordInput.addEventListener(
    "input",
    (e) => {
      newPasswordInput.value = (e.target as HTMLInputElement).value.replace(
        /\s/g,
        "",
      );
      setFieldErrorStatus(newPasswordInputError, "", newPasswordInput);

      newPasswordValidation = validatePassword(newPasswordInput.value);
      isNewPasswordValid = newPasswordValidation.isValid;

      if (confirmPasswordInput.value.length > 0) {
        if (newPasswordInput.value === confirmPasswordInput.value) {
          setFieldErrorStatus(
            confirmPasswordInputError,
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

  newPasswordInput.addEventListener(
    "blur",
    (e) => {
      setFieldErrorStatus(
        newPasswordInputError,
        newPasswordValidation.message,
        newPasswordInput,
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
      setFieldErrorStatus(confirmPasswordInputError, "", confirmPasswordInput);

      confirmPasswordValidation = validateConfirmPassword(
        newPasswordInput.value,
        confirmPasswordInput.value,
      );
      isConfirmPasswordValid = confirmPasswordValidation.isValid;

      checkFormValidity();
    },
    { signal },
  );

  confirmPasswordInput.addEventListener(
    "blur",
    (e) => {
      setFieldErrorStatus(
        confirmPasswordInputError,
        confirmPasswordValidation.message,
        confirmPasswordInput,
      );
    },
    { signal },
  );

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    submitBtn.setAttribute("data-loading", "true");
    submitBtn.disabled = true;

    const userData = {
      current_password: currentPasswordInput.value,
      new_password: newPasswordInput.value,
      confirm_password: confirmPasswordInput.value,
    };

    try {
      const response = await apiRequest<ProfilePasswordEditResponse>(
        `${API_BASE_URL}/${API_ENDPOINTS.PROFILE}/password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        },
      );

      if (response.success) {
        submitBtn.disabled = true;

        closeEditPasswordForm();

        window.__AUTH_STATE__.hasPassword = true;

        passwordEditBtn.textContent = "Change Password";

        currentPasswordField.classList.remove("is-hidden");

        showNotice({
          message: "Password updated successfully!",
          type: "success",
        });
      }
    } catch (error: unknown) {
      console.error(error);

      if (isApiError(error)) {
        if (error.status === 400 || error.status === 409) {
          const targetInputName = error.targetInput;
          const message = error.message;

          const targetInput = getElement<HTMLInputElement>(
            `[data-js=profile-${targetInputName}]`,
          );
          const targetInputError = getElement<HTMLSpanElement>(
            `[data-js=profile-${targetInputName}-error]`,
          );

          setFieldErrorStatus(targetInputError, message, targetInput);

          switch (targetInputName) {
            case "current-password":
              isCurrentPasswordValid = false;
              currentPasswordValidation = { message, isValid: false };
              break;

            case "new-password":
              isNewPasswordValid = false;
              newPasswordValidation = { message, isValid: false };
              break;
            case "confirm-password":
              isConfirmPasswordValid = false;
              confirmPasswordValidation = { message, isValid: false };
              break;
          }

          targetInput.focus();
          checkFormValidity();
          return;
        }

        if (error.status === 401 || error.status === 404) {
          resetAuthState();
          notifySessionTerminated();
          clearAllScrollStorage();
          initHeaderAuthUI();

          history.replaceState({}, "", "/sign-in");
          navigate();

          showNotice({
            message:
              "Your session has expired or the account could not be found. Please sign in again.",
            type: "error",
          });
          return;
        }

        showNotice({
          message: "Failed to update password. Please try again.",
          type: "error",
        });
        return;
      } else {
        showNotice({
          message: "Failed to update password. Please try again.",
          type: "error",
        });
      }
    } finally {
      submitBtn.setAttribute("data-loading", "false");
    }
  });
}

export function cleanupPasswordEdit() {
  passwordEditController?.abort();
  passwordEditController = null;
}
