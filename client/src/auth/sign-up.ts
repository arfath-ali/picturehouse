import { mockApiResponse } from "../api/mock-api.js";
import { signUp } from "../api/sign-up.js";
import { setAppState } from "../state/app.js";
import type { FormValidationResult } from "../types/form-validation-result.js";
import {
  checkUsernameAvailability,
  clearUsernameDebounce,
} from "../utils/check-username-availability.js";
import { getElement } from "../utils/dom.js";
import { setFieldErrorStatus } from "../utils/form-ui.js";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
} from "../utils/form-validation.js";
import { showPageError } from "../utils/show-page-error.js";

export function initSignUp() {
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

  async function checkFormValidity() {
    submitBtn.disabled = !(
      isUsernameValid &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmPasswordValid
    );
  }

  usernameInput.addEventListener("input", async (e) => {
    clearUsernameDebounce();
    usernameInput.value = (e.target as HTMLInputElement).value
      .toLowerCase()
      .replace(/\s/g, "");

    setFieldErrorStatus(usernameInputErrorElement);

    usernameValidation = validateUsername(usernameInput.value);
    isUsernameValid = usernameValidation.isValid;

    if (isUsernameValid) {
      usernameValidation = await checkUsernameAvailability(usernameInput.value);
      setFieldErrorStatus(
        usernameInputErrorElement,
        usernameValidation.message,
      );

      isUsernameValid = usernameValidation.isValid;
    }

    checkFormValidity();
  });

  usernameInput.addEventListener("blur", async () => {
    setFieldErrorStatus(usernameInputErrorElement, usernameValidation.message);
  });

  emailInput.addEventListener("input", () => {
    setFieldErrorStatus(emailInputErrorElement);

    emailValidation = validateEmail(emailInput.value);
    isEmailValid = emailValidation.isValid;

    checkFormValidity();
  });

  emailInput.addEventListener("blur", () => {
    setFieldErrorStatus(emailInputErrorElement, emailValidation.message);
  });

  passwordInput.addEventListener("input", (e) => {
    passwordInput.value = (e.target as HTMLInputElement).value.replace(
      /\s/g,
      "",
    );
    setFieldErrorStatus(passwordInputErrorElement);

    passwordValidation = validatePassword(passwordInput.value);
    isPasswordValid = passwordValidation.isValid;

    checkFormValidity();
  });

  passwordInput.addEventListener("blur", (e) => {
    setFieldErrorStatus(passwordInputErrorElement, passwordValidation.message);
  });

  confirmPasswordInput.addEventListener("input", (e) => {
    confirmPasswordInput.value = (e.target as HTMLInputElement).value.replace(
      /\s/g,
      "",
    );
    setFieldErrorStatus(confirmPasswordInputErrorElement);

    confirmPasswordValidation = validateConfirmPassword(
      passwordInput.value,
      confirmPasswordInput.value,
    );
    isConfirmPasswordValid = confirmPasswordValidation.isValid;

    checkFormValidity();
  });

  confirmPasswordInput.addEventListener("blur", (e) => {
    setFieldErrorStatus(
      confirmPasswordInputErrorElement,
      confirmPasswordValidation.message,
    );
  });

  submitBtn.addEventListener("click", async (e) => {
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
      const response = await signUp(userData);

      if (response.success) {
        window.location.href = "/verify-email";
      }
    } catch (error: any) {
      submitBtn.setAttribute("data-loading", "false");
      submitBtn.disabled = false;
      if (error.status === 409) {
        const fieldName = error.backendResponse.field;
        const message = error.backendResponse.message;

        const targetInput = getElement<HTMLInputElement>(
          `[data-js=signup-${fieldName}]`,
        );
        const targetInputErrorElement = getElement<HTMLSpanElement>(
          `[data-js=signup-${fieldName}-error]`,
        );
        setFieldErrorStatus(targetInputErrorElement, message);
        if (fieldName === "username") isUsernameValid = false;
        if (fieldName === "email") isEmailValid = false;
        if (fieldName === "password") isPasswordValid = false;
        if (fieldName === "confirm-password") isConfirmPasswordValid = false;

        targetInput.focus();
        checkFormValidity();
      } else if (error.status === 404) {
        setAppState("not-found");
      } else {
        showPageError("signup-page");
      }
    }
  });
}
