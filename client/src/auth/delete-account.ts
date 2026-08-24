import { apiRequest } from "../api/api-request.js";
import { showNotice } from "../components/show-notice.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { clearAllScrollStorage } from "../scroll/window.js";
import { authStore } from "../state/auth-store.js";
import type { DeleteAccountResponse } from "../types/api-response.js";
import { notifySessionTerminated } from "../utils/auth-channel.js";
import { resetAuthState } from "../utils/auth-state.js";
import { getElement, getElements } from "../utils/dom.js";
import { setFieldErrorStatus } from "../utils/form-ui.js";
import { isApiError } from "../utils/is-api-error.js";
import { togglePasswordVisibilty } from "../utils/password-visibility.js";
import { googleAuth } from "./google-auth.js";
import { initHeaderAuthUI } from "./header-auth-ui.js";
import { resetForm } from "./reset-form.js";

let deleteAccountController: AbortController | null = null;

export function reopenDeleteAccountModal() {
  const deleteModalPage = getElement("[data-js='profile-delete']");
  const deleteModalTwo = getElement("[data-js='delete-modal-2']");

  document.body.classList.add("no-scroll");
  document.querySelector("main")?.setAttribute("inert", "");

  deleteModalPage.classList.add("is-visible");

  deleteModalTwo.classList.add("is-visible");

  deleteAccountController?.abort();
  deleteAccountController = new AbortController();
  const signal = deleteAccountController.signal;

  initPasswordDeletionForm(signal);
  togglePasswordVisibilty();
  googleAuth();
}

export function initDeleteAccount() {
  const isGoogleUser = window.__AUTH_STATE__.isGoogleUser;

  const deleteModalPage = getElement("[data-js='profile-delete']");
  const openDeleteModalBtn = getElement("[data-js='delete-account-btn']");
  const proceedDeleteBtn = getElement("[data-js='delete-modal-proceed']");
  const closeDeleteModalBtns = getElements("[data-js='delete-modal-close']");
  const deleteModalOne = getElement("[data-js='delete-modal-1']");
  const deleteModalTwo = getElement<HTMLElement>("[data-js='delete-modal-2']");

  deleteAccountController?.abort();
  deleteAccountController = new AbortController();
  const signal = deleteAccountController.signal;

  deleteModalTwo.dataset.isGoogleUser = String(isGoogleUser);

  openDeleteModalBtn.addEventListener(
    "click",
    () => {
      document.body.classList.add("no-scroll");
      document.querySelector("main")?.setAttribute("inert", "");

      deleteModalPage.classList.add("is-visible");
      deleteModalOne.classList.add("is-visible");
      history.pushState(null, "");
    },
    { signal },
  );

  proceedDeleteBtn.addEventListener(
    "click",
    () => {
      deleteModalOne.classList.remove("is-visible");
      deleteModalTwo.classList.add("is-visible");
      initPasswordDeletionForm(signal);
      togglePasswordVisibilty();
      googleAuth();
    },
    { signal },
  );

  closeDeleteModalBtns.forEach((closeBtn) => {
    closeBtn.addEventListener(
      "click",
      () => {
        closeDeleteAccountModal();
      },
      { signal },
    );
  });
}

export function closeDeleteAccountModal() {
  const deleteModalPage = getElement("[data-js='profile-delete']");
  const deleteModalOne = getElement("[data-js='delete-modal-1']");
  const deleteModalTwo = getElement("[data-js='delete-modal-2']");

  document.body.classList.remove("no-scroll");
  document.querySelector("main")?.removeAttribute("inert");

  deleteModalPage?.classList.remove("is-visible");
  deleteModalOne?.classList.remove("is-visible");
  deleteModalTwo?.classList.remove("is-visible");

  resetForm();
}

function initPasswordDeletionForm(signal: AbortSignal) {
  function checkFormValidity() {
    submitBtn.disabled = !isPasswordValid;
  }

  const passwordInput = getElement<HTMLInputElement>(
    "[data-js='delete-password-input']",
  );
  const passwordInputError = getElement<HTMLSpanElement>(
    "[data-js='delete-password-error']",
  );
  let isPasswordValid: boolean = false;

  const submitBtn = getElement<HTMLButtonElement>(
    "[data-js='confirm-delete-btn']",
  );

  passwordInput.addEventListener(
    "input",
    (e) => {
      const value = (e.target as HTMLInputElement).value.trim();

      setFieldErrorStatus(passwordInputError, "", passwordInput);

      isPasswordValid = value !== "";

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
      document.body.classList.add("is-deleting");

      try {
        const response = await apiRequest<DeleteAccountResponse>(
          `${API_BASE_URL}/${API_ENDPOINTS.DELETE_ACCOUNT}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ password: passwordInput.value }),
          },
        );

        if (response.success) {
          resetAuthState();
          notifySessionTerminated();
          clearAllScrollStorage();
          initHeaderAuthUI();
          history.replaceState({}, "", "/sign-in");
          navigate();
          showNotice({
            message: "Your account has been deleted successfully.",
            type: "info",
          });
        }
      } catch (error: unknown) {
        console.error(error);

        submitBtn.setAttribute("data-loading", "false");
        submitBtn.disabled = false;

        if (isApiError(error)) {
          if (
            error.status === 400 ||
            (error.status === 401 && error.code === "INVALID_CREDENTIALS")
          ) {
            const message = error.message;

            const passwordInput = getElement<HTMLInputElement>(
              "[data-js='delete-password-input']",
            );
            const passwordInputError = getElement<HTMLSpanElement>(
              "[data-js='delete-password-error']",
            );

            setFieldErrorStatus(passwordInputError, message, passwordInput);
            isPasswordValid = false;

            passwordInput.focus();
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
            message: "Failed to delete account. Please try again.",
            type: "error",
          });
          return;
        }

        showNotice({
          message: "Failed to delete account. Please try again.",
          type: "error",
        });
      } finally {
        document.body.classList.remove("is-deleting");
        submitBtn.setAttribute("data-loading", "false");
        submitBtn.disabled = true;
      }
    },
    { signal },
  );
}

export function cleanupDeleteAccountController() {
  deleteAccountController?.abort();
  deleteAccountController = null;
  closeDeleteAccountModal();
}
