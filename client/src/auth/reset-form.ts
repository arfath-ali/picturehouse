import { authStore } from "../state/auth-store.js";
import { resetUsernameStatus } from "../utils/check-username-availability.js";
import { getElements } from "../utils/dom.js";
import { resetPasswordVisibility } from "../utils/password-visibility.js";

export function resetForm() {
  const forms = getElements<HTMLFormElement>("[data-role='auth-form']");
  const formInputs = getElements<HTMLInputElement>("[data-role='form-input']");
  const formErrors = getElements<HTMLElement>("[data-role='form-error']");
  const formBtns = getElements<HTMLButtonElement>("[data-role='form-btn']");

  forms.forEach((form) => form.reset());

  resetUsernameStatus();

  resetPasswordVisibility();

  authStore.clearPendingVerificationEmail();
  authStore.clearPendingPasswordResetEmail();
  authStore.setIsPasswordResetSuccessful(false);

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
}
