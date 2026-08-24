import { apiRequest } from "../api/api-request.js";
import { mockApiResponse } from "../api/mock-api.js";
import { cleanupDeleteAccountController } from "../auth/delete-account.js";
import { initHeaderAuthUI } from "../auth/header-auth-ui.js";
import { resetForm } from "../auth/reset-form.js";
import { showNotice } from "../components/show-notice.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { clearAllScrollStorage } from "../scroll/window.js";
import { authStore } from "../state/auth-store.js";
import type { ProfileEmailEditResponse } from "../types/api-response.js";
import type { AppState } from "../types/app-state.js";
import type { FormValidationResult } from "../types/form-validation-result.js";
import { notifySessionTerminated } from "../utils/auth-channel.js";
import { resetAuthState } from "../utils/auth-state.js";
import { getElement } from "../utils/dom.js";
import { setFieldErrorStatus } from "../utils/form-ui.js";
import { validateEmail } from "../utils/form-validation.js";
import { isApiError } from "../utils/is-api-error.js";

let emailEditController: AbortController | null = null;

export function reopenEmailEditModal() {
  const emailEditModalPage = getElement("[data-js='profile-email-edit']");
  const emailEditContent = getElement("[data-js='email-edit-content']");

  document.body.classList.add("no-scroll");
  document.querySelector("main")?.setAttribute("inert", "");

  emailEditModalPage.classList.add("is-visible");
  emailEditContent.classList.add("is-visible");

  emailEditController?.abort();
  emailEditController = new AbortController();
  const signal = emailEditController.signal;

  initEmailEditForm(signal);
}

export function initEditEmail() {
  const emailEditBtn = getElement<HTMLButtonElement>(
    "[data-js='email-edit-btn']",
  );

  const emailEditModalPage = getElement("[data-js='profile-email-edit']");
  const emailEditContent = getElement("[data-js='email-edit-content']");

  emailEditController?.abort();
  emailEditController = new AbortController();
  const signal = emailEditController.signal;

  emailEditBtn.addEventListener("click", () => {
    if (!window.__AUTH_STATE__.hasPassword) {
      const message = window.__AUTH_STATE__.isGoogleUser
        ? "Since you signed in with Google, please set an account password before changing your email address."
        : "Please set an account password before changing your email address.";

      showNotice({ message, type: "info" });
      return;
    }

    document.body.classList.add("no-scroll");
    document.querySelector("main")?.setAttribute("inert", "");

    emailEditModalPage.classList.add("is-visible");
    emailEditContent.classList.add("is-visible");
    history.pushState({ modal: "email-edit" }, "");
    initEmailEditForm(signal);
  });
}

export function closeEmailEditModal() {
  const emailEditModalPage = getElement("[data-js='profile-email-edit']");
  const emailEditContent = getElement("[data-js='email-edit-content']");

  document.body.classList.remove("no-scroll");
  document.querySelector("main")?.removeAttribute("inert");

  emailEditModalPage.classList.remove("is-visible");
  emailEditContent.classList.remove("is-visible");
  resetNewEmailForm();
}

function initEmailEditForm(signal: AbortSignal) {
  function checkFormValidity() {
    submitBtn.disabled = !(isEmailChanged && isEmailValid);
  }

  const profileEmail = getElement<HTMLInputElement>(
    "[data-js='profile-email']",
  );

  const emailInput = getElement<HTMLInputElement>(
    "[data-js='email-edit-input'",
  );
  const emailInputError = getElement<HTMLSpanElement>(
    "[data-js='email-edit-error']",
  );
  let emailValidation: FormValidationResult = {
    message: "",
    isValid: false,
  };
  let isEmailValid: boolean = false;
  let initialEmail = profileEmail.value;
  let isEmailChanged = false;

  let lastServerRejectedEmail = "";

  const closeEmailEditBtn = getElement("[data-js='email-edit-close']");

  const submitBtn = getElement<HTMLButtonElement>(
    "[data-js='email-edit-submit-btn']",
  );

  closeEmailEditBtn.addEventListener(
    "click",
    () => {
      closeEmailEditModal();
    },
    { signal },
  );

  emailInput.addEventListener(
    "input",
    () => {
      const currentEmail = emailInput.value.trim();

      isEmailChanged = currentEmail !== initialEmail;

      if (currentEmail && currentEmail === lastServerRejectedEmail) {
        emailValidation = { message: "Email already exists.", isValid: false };
        isEmailValid = false;
        setFieldErrorStatus(
          emailInputError,
          emailValidation.message,
          emailInput,
        );
      } else {
        setFieldErrorStatus(emailInputError, "", emailInput);
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
      setFieldErrorStatus(emailInputError, emailValidation.message, emailInput);
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
        const response = await apiRequest<ProfileEmailEditResponse>(
          `${API_BASE_URL}/${API_ENDPOINTS.PROFILE}/email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: emailInput.value }),
          },
        );

        if (response.success) {
          lastServerRejectedEmail = "";

          authStore.setPendingVerificationEmail(emailInput.value);

          submitBtn.disabled = true;

          if (authStore.getPendingVerificationEmail() !== "") {
            closeEmailEditModal();

            history.replaceState({}, "", "/verify-email?source=profile");
            navigate();
            return;
          } else {
            showNotice({
              message: "Failed to change email. Please try again.",
              type: "error",
            });
            submitBtn.setAttribute("data-loading", "false");
            submitBtn.disabled = false;
            return;
          }
        }
      } catch (error: unknown) {
        console.error(error);

        submitBtn.setAttribute("data-loading", "false");
        submitBtn.disabled = false;

        if (isApiError(error)) {
          if (error.status === 400 || error.status === 409) {
            const message = error.message;

            setFieldErrorStatus(emailInputError, message, emailInput);
            isEmailValid = false;

            if (error.code === "EMAIL_ALREADY_EXISTS") {
              lastServerRejectedEmail = emailInput.value.trim();
            } else {
              lastServerRejectedEmail = "";
            }

            emailInput.focus();
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
            message: "Failed to change email. Please try again.",
            type: "error",
          });
          return;
        }

        showNotice({
          message: "Failed to change email. Please try again.",
          type: "error",
        });
      } finally {
        submitBtn.setAttribute("data-loading", "false");
      }
    },
    { signal },
  );
}

export function resetNewEmailForm() {
  const emailInput = getElement<HTMLInputElement>(
    "[data-js='email-edit-input']",
  );
  const emailInputError = getElement<HTMLSpanElement>(
    "[data-js='email-edit-error']",
  );
  const submitBtn = getElement<HTMLButtonElement>(
    "[data-js='email-edit-submit-btn']",
  );

  emailInput.value = "";
  setFieldErrorStatus(emailInputError, "", emailInput);
  submitBtn.disabled = true;
  submitBtn.setAttribute("data-loading", "false");
}

export function cleanupEmailEdit() {
  emailEditController?.abort();
  emailEditController = null;
}
