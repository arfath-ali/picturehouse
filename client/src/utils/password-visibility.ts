import { getElements } from "./dom.js";
import { setFieldErrorStatus } from "./form-ui.js";

let passwordVisibilityController: AbortController | null = null;

export function togglePasswordVisibilty() {
  const passwordVisibilityIcons = getElements<SVGElement>(
    "[data-js='password-visibility-icon']",
  );

  passwordVisibilityController?.abort();
  passwordVisibilityController = new AbortController();
  const signal = passwordVisibilityController.signal;

  passwordVisibilityIcons.forEach((icon) => {
    const passwordField = icon.closest(
      ".auth-form__field, .profile__field",
    );

    const passwordInput = passwordField?.querySelector<HTMLInputElement>(
      ".auth-form__input--password, .profile__input--password",
    );

    const passwordInputErrorElement =
      passwordField?.querySelector<HTMLSpanElement>(
        ".auth-form__field-error, .profile__field-error",
      );

    const useElement = icon.querySelector("use");

    if (!passwordInput || !useElement) return;

    icon.addEventListener(
      "mousedown",
      (e) => {
        e.preventDefault();
      },
      { signal },
    );

    icon.addEventListener(
      "click",
      () => {
        const isPasswordVisible = passwordInput.type === "text";

        passwordInput.type = isPasswordVisible ? "password" : "text";

        useElement.setAttribute(
          "href",
          isPasswordVisible
            ? "#icon-password-visible-off"
            : "#icon-password-visible",
        );

        if (passwordInputErrorElement) {
          const hasErrorMessage =
            passwordInputErrorElement.textContent?.trim() !== "";
          if (!hasErrorMessage) {
            setFieldErrorStatus(passwordInputErrorElement);
          }
        }

        requestAnimationFrame(() => {
          passwordInput.focus();
          const length = passwordInput.value.length;
          passwordInput.setSelectionRange(length, length);
        });
      },
      { signal },
    );
  });
}

export function resetPasswordVisibility() {
  const passwordInputs = getElements<HTMLInputElement>(
    ".auth-form__input--password, .profile__input--password",
  );

  passwordInputs.forEach((input) => {
    input.type = "password";

    const icon = input
      .closest(".auth-form__field, .profile__field")
      ?.querySelector<SVGUseElement>(
        "[data-js='password-visibility-icon'] use",
      );

    icon?.setAttribute("href", "#icon-password-visible-off");
  });
}

export function cleanupPasswordVisibility() {
  passwordVisibilityController?.abort();
  passwordVisibilityController = null;
}
