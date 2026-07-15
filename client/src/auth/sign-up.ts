import { signUp } from "../api/sign-up.js";
import { setAppState } from "../state/app.js";
import { getElement } from "../utils/dom.js";
import { setFieldError } from "../utils/form-ui.js";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
} from "../utils/form-validation.js";

export function initSignUp() {
  const usernameInput = getElement<HTMLInputElement>(
    "[data-js='signup-username']",
  );
  const useranmeInputError = getElement<HTMLSpanElement>(
    "[data-js='signup-username-error']",
  );

  const emailInput = getElement<HTMLInputElement>("[data-js='signup-email'");
  const emailInputError = getElement<HTMLSpanElement>(
    "[data-js='signup-email-error']",
  );

  const passwordInput = getElement<HTMLInputElement>(
    "[data-js='signup-password'",
  );
  const passwordInputError = getElement<HTMLSpanElement>(
    "[data-js='signup-password-error']",
  );

  const confirmPasswordInput = getElement<HTMLInputElement>(
    "[data-js='signup-confirm-password']",
  );
  const confirmPasswordInputError = getElement<HTMLSpanElement>(
    "[data-js='signup-confirm-password-error']",
  );

  const submitBtn = getElement<HTMLButtonElement>("[data-js='signup-btn']");

  function checkFormValidity() {
    const isUsernameValid =
      usernameInput.value.length > 0 && !validateUsername(usernameInput.value);
    const isEmailValid =
      emailInput.value.length > 0 && !validateEmail(emailInput.value);
    const isPasswordValid =
      passwordInput.value.length > 0 && !validatePassword(passwordInput.value);
    const isConfirmValid =
      confirmPasswordInput.value.length > 0 &&
      !validateConfirmPassword(passwordInput.value, confirmPasswordInput.value);

    submitBtn.disabled = !(
      isUsernameValid &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmValid
    );
  }

  usernameInput.addEventListener("input", (e) => {
    usernameInput.value = (e.target as HTMLInputElement).value
      .toLowerCase()
      .replace(/\s/g, "");
    setFieldError(useranmeInputError);
    checkFormValidity();
  });

  usernameInput.addEventListener("blur", () => {
    const errorMessage = validateUsername(usernameInput.value);
    if (errorMessage) setFieldError(useranmeInputError, errorMessage);
  });

  emailInput.addEventListener("input", () => {
    setFieldError(emailInputError);
    checkFormValidity();
  });

  emailInput.addEventListener("blur", () => {
    const errorMessage = validateEmail(emailInput.value);
    if (errorMessage) setFieldError(emailInputError, errorMessage);
  });

  passwordInput.addEventListener("input", (e) => {
    passwordInput.value = (e.target as HTMLInputElement).value.replace(
      /\s/g,
      "",
    );
    setFieldError(passwordInputError);
    checkFormValidity();
  });

  passwordInput.addEventListener("blur", () => {
    const errorMessage = validatePassword(passwordInput.value);
    if (errorMessage) setFieldError(passwordInputError, errorMessage);
  });

  confirmPasswordInput.addEventListener("input", (e) => {
    confirmPasswordInput.value = (e.target as HTMLInputElement).value.replace(
      /\s/g,
      "",
    );
    setFieldError(confirmPasswordInputError);
    checkFormValidity();
  });

  confirmPasswordInput.addEventListener("blur", () => {
    const errorMessage = validateConfirmPassword(
      passwordInput.value,
      confirmPasswordInput.value,
    );
    if (errorMessage) setFieldError(confirmPasswordInputError, errorMessage);
  });

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const userData = {
      username: usernameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
    };

    try {
      await signUp(userData);
    } catch (error: any) {
      if (error.status === 409) {
        setFieldError(emailInputError, error.backendMessage);
        emailInput.focus();
      } else if (error.status === 404) {
        setAppState("not-found");
      } else {
        setAppState("not-found");
      }
    }
  });
}
