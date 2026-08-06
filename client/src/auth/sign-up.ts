import { apiRequest } from "../api/api-request.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { setAppState } from "../state/app.js";
import { authStore } from "../state/auth-store.js";
import type { SignUpResponse } from "../types/api-response.js";
import type { FormValidationResult } from "../types/form-validation-result.js";
import {
  checkUsernameAvailability,
  clearUsernameDebounce,
  resetUsernameStatus,
} from "../utils/check-username-availability.js";
import { getElement } from "../utils/dom.js";
import { setFieldErrorStatus } from "../utils/form-ui.js";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
} from "../utils/form-validation.js";
import { isApiError } from "../utils/is-api-error.js";
import { showPageError } from "../utils/show-page-error.js";
import { resetForm } from "./reset-form.js";

let signUpController: AbortController | null = null;

export function initSignUp() {
  resetForm();

  const usernameInput = getElement<HTMLInputElement>(
    "[data-js='signup-username']",
  );
  const usernameInputErrorElement = getElement<HTMLSpanElement>(
    "[data-js='signup-username-error']",
  );
  let usernameValidation: FormValidationResult = {
    message: "",
    isValid: false,
  };
  let isUsernameValid: boolean = false;

  const emailInput = getElement<HTMLInputElement>("[data-js='signup-email'");
  const emailInputErrorElement = getElement<HTMLSpanElement>(
    "[data-js='signup-email-error']",
  );
  let emailValidation: FormValidationResult = {
    message: "",
    isValid: false,
  };
  let isEmailValid: boolean = false;
  let lastServerRejectedEmail = "";

  const passwordInput = getElement<HTMLInputElement>(
    "[data-js='signup-password'",
  );
  const passwordInputErrorElement = getElement<HTMLSpanElement>(
    "[data-js='signup-password-error']",
  );
  let passwordValidation: FormValidationResult = {
    message: "",
    isValid: false,
  };
  let isPasswordValid: boolean = false;

  const confirmPasswordInput = getElement<HTMLInputElement>(
    "[data-js='signup-confirm-password']",
  );
  const confirmPasswordInputErrorElement = getElement<HTMLSpanElement>(
    "[data-js='signup-confirm-password-error']",
  );

  let confirmPasswordValidation: FormValidationResult = {
    message: "",
    isValid: false,
  };
  let isConfirmPasswordValid: boolean = false;

  const submitBtn = getElement<HTMLButtonElement>("[data-js='signup-btn']");

  signUpController?.abort();
  signUpController = new AbortController();
  const signal = signUpController.signal;

  function checkFormValidity() {
    submitBtn.disabled = !(
      isUsernameValid &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmPasswordValid
    );
  }

  usernameInput.addEventListener(
    "input",
    async (e) => {
      clearUsernameDebounce();
      usernameInput.value = (e.target as HTMLInputElement).value
        .toLowerCase()
        .replace(/\s/g, "");

      setFieldErrorStatus(usernameInputErrorElement, "", usernameInput);

      usernameValidation = validateUsername(usernameInput.value);
      isUsernameValid = usernameValidation.isValid;

      if (isUsernameValid) {
        usernameValidation = await checkUsernameAvailability(
          usernameInput.value,
        );
        setFieldErrorStatus(
          usernameInputErrorElement,
          usernameValidation.message,
          usernameInput,
        );

        isUsernameValid = usernameValidation.isValid;
      }

      checkFormValidity();
    },
    { signal },
  );

  usernameInput.addEventListener(
    "blur",
    async () => {
      setFieldErrorStatus(
        usernameInputErrorElement,
        usernameValidation.message,
        usernameInput,
      );
    },
    { signal },
  );

  emailInput.addEventListener(
    "input",
    () => {
      const currentEmail = emailInput.value.trim();

      if (currentEmail && currentEmail === lastServerRejectedEmail) {
        emailValidation = { message: "Email already exists.", isValid: false };
        isEmailValid = false;
        setFieldErrorStatus(
          emailInputErrorElement,
          emailValidation.message,
          emailInput,
        );
      } else {
        setFieldErrorStatus(emailInputErrorElement, "", emailInput);
        emailValidation = validateEmail(currentEmail);
        isEmailValid = emailValidation.isValid;
      }

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
    (e) => {
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
    (e) => {
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

      const userData = {
        username: usernameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        confirmPassword: confirmPasswordInput.value,
      };

      try {
        const response = await apiRequest<SignUpResponse>(
          `${API_BASE_URL}/${API_ENDPOINTS.SIGNUP}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          },
        );

        if (response.success) {
          lastServerRejectedEmail = "";
          authStore.setPendingVerificationEmail(userData.email);
          history.replaceState({}, "", "/verify-email");
          navigate();
        }
      } catch (error: unknown) {
        console.error(error);

        submitBtn.setAttribute("data-loading", "false");
        submitBtn.disabled = false;

        if (isApiError(error)) {
          if (error.status === 400 || error.status === 409) {
            const targetInputName = error.targetInput;
            const message = error.message;

            const targetInput = getElement<HTMLInputElement>(
              `[data-js=signup-${targetInputName}]`,
            );
            const targetInputError = getElement<HTMLSpanElement>(
              `[data-js=signup-${targetInputName}-error]`,
            );

            setFieldErrorStatus(targetInputError, message, targetInput);

            switch (targetInputName) {
              case "username":
                isUsernameValid = false;
                usernameValidation = { message, isValid: false };
                resetUsernameStatus();
                break;
              case "email":
                isEmailValid = false;
                emailValidation = { message, isValid: false };
                if (error.code === "EMAIL_ALREADY_EXISTS") {
                  lastServerRejectedEmail = emailInput.value.trim();
                } else {
                  lastServerRejectedEmail = "";
                }
                break;
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
          } else if (error.status === 404) {
            setAppState("not-found");
          } else {
            showPageError("signup-page");
          }
        } else {
          showPageError("signup-page");
        }
      }
    },
    { signal },
  );
}

export function cleanupSignUpController() {
  signUpController?.abort();
  signUpController = null;
}
