import { resetNewEmailForm } from "../profile/edit-email.js";
import { authStore } from "../state/auth-store.js";
import type { AppState } from "../types/app-state.js";
import { resetUsernameStatus } from "../utils/check-username-availability.js";
import { getElement, getElements } from "../utils/dom.js";
import { resetPasswordVisibility } from "../utils/password-visibility.js";

export function resetForm() {
  let route = location.pathname.slice(1) as AppState;

  const forms = getElements<HTMLFormElement>(
    "[data-role='auth-form'], [data-role='profile-form']",
  );
  const signupUsernameInputRow = getElement<HTMLElement>(
    "[data-js='signup-username-row']",
  );
  const formInputs = getElements<HTMLInputElement>("[data-role='form-input']");
  const formErrors = getElements<HTMLElement>("[data-role='form-error']");
  const formBtns = getElements<HTMLButtonElement>("[data-role='form-btn']");

  forms.forEach((form) => form.reset());

  resetUsernameStatus(signupUsernameInputRow);

  resetPasswordVisibility();

  if (route !== "verify-email") {
    authStore.clearPendingVerificationEmail();
  }

  if (route !== "reset-password-email-sent") {
    authStore.clearPendingPasswordResetEmail();
  }

  if (route !== "reset-password-success") {
    authStore.setIsPasswordResetSuccessful(false);
  }

  formErrors.forEach((formError) => {
    formError.textContent = "";
    formError.classList.remove("is-visible");
  });

  formInputs.forEach((formInput) => {
    formInput.classList.remove("is-error");
  });

  formBtns.forEach((formBtn) => {
    formBtn.dataset.loading = "false";
  });

  const searchParams = new URLSearchParams(window.location.search);
  const isProfileVerifyFlow =
    window.location.pathname === "/verify-email" &&
    searchParams.get("source") === "profile";

  if (!isProfileVerifyFlow) {
    resetNewEmailForm();
  }
}
