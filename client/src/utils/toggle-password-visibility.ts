import { getElement } from "./dom.js";

export function togglePasswordVisibilty() {
  const passwordInput = getElement<HTMLInputElement>(
    ".auth-form__input--password",
  );
  const passwordVisibiltyIcon = getElement<SVGElement>(
    ".auth-form__password-visibility-icon",
  );
  const useElement = passwordVisibiltyIcon.querySelector("use");

  passwordVisibiltyIcon.addEventListener("click", () => {
    const isPasswordVisible = passwordInput.type === "text";

    passwordInput.type = isPasswordVisible ? "password" : "text";

    useElement?.setAttribute(
      "href",
      isPasswordVisible
        ? "#icon-password-visible-off"
        : "#icon-password-visible",
    );
  });
}
