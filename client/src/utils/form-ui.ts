export function setFieldErrorStatus(
  errorElement: HTMLElement,
  message = "",
  inputElements?: HTMLInputElement | HTMLInputElement[],
) {
  errorElement.textContent = message;

  errorElement.classList.toggle("is-visible", message.trim() !== "");

  const elements = Array.isArray(inputElements)
    ? inputElements
    : [inputElements];

  elements.forEach((element) => {
    element?.classList.toggle("is-error", message.trim() !== "");
  });
}
