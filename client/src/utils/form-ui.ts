export function setFieldErrorStatus(errorElement: HTMLElement, message = "") {
  errorElement.textContent = message;

  errorElement.classList.toggle("is-visible", message.trim() !== "");
}
