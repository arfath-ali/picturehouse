import { getElements } from "./dom.js";

export function togglePasswordVisibilty() {
  const passwordVisibiltyIcons = getElements<SVGElement>(
    ".auth-form__password-visibility-icon",
  );

  passwordVisibiltyIcons.forEach((icon) => {
    const passwordInputRow = icon.closest(".auth-form__input-row--password");

    const passwordInput = passwordInputRow?.querySelector<HTMLInputElement>(
      ".auth-form__input--password",
    );

    const useElement = icon.querySelector("use");

    if (!passwordInput || !useElement) return;

    icon.addEventListener("click", (e) => {
      const isPasswordVisible = passwordInput.type === "text";

      passwordInput.type = isPasswordVisible ? "password" : "text";

      useElement.setAttribute(
        "href",
        isPasswordVisible
          ? "#icon-password-visible-off"
          : "#icon-password-visible",
      );
    });
  });
}
