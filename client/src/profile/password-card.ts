import { resetForm } from "../auth/reset-form.js";
import { authStore } from "../state/auth-store.js";
import { getElement } from "../utils/dom.js";
import { togglePasswordVisibilty } from "../utils/password-visibility.js";
import { initEditPassword } from "./edit-password.js";

let passwordCardController: AbortController | null = null;

export function initPasswordCard() {
  const passwordEditBtn = getElement<HTMLButtonElement>(
    "[data-js='edit-password-btn']",
  );

  const passwordForm = getElement("[data-js='profile-password-form']");

  const currentPassword = getElement<HTMLInputElement>(
    "[data-js='profile-current-password']",
  );

  const newPasswordForm = getElement<HTMLFormElement>(
    "[data-js='profile-new-password-form']",
  );
  const newPassword = getElement<HTMLInputElement>(
    "[data-js='profile-new-password']",
  );

  const passwordEditCancelBtn = getElement<HTMLButtonElement>(
    "[data-js='edit-password-cancel-btn']",
  );

  passwordCardController?.abort();
  passwordCardController = new AbortController();
  const signal = passwordCardController.signal;

  passwordEditBtn.addEventListener(
    "click",
    () => {
      passwordForm.classList.add("is-hidden");
      newPasswordForm.classList.add("is-visible");
      newPasswordForm.dataset.isEditing = "true";
      if (window.__AUTH_STATE__?.hasPassword) {
        currentPassword.focus();
      } else {
        newPassword.focus();
      }
      initEditPassword();
      togglePasswordVisibilty();
    },
    { signal },
  );

  passwordEditCancelBtn.addEventListener(
    "click",
    () => {
      closeEditPasswordForm();
    },
    { signal },
  );
}

export function closeEditPasswordForm() {
  const passwordForm = getElement("[data-js='profile-password-form']");
  const newPasswordForm = getElement<HTMLFormElement>(
    "[data-js='profile-new-password-form']",
  );
  passwordForm.classList.remove("is-hidden");
  newPasswordForm.classList.remove("is-visible");
  newPasswordForm.dataset.isEditing = "false";
  resetForm();
}

export function cleanupPasswordCard() {
  passwordCardController?.abort();
  passwordCardController = null;
  closeEditPasswordForm();
}
