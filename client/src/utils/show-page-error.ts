import { ErrorState } from "../components/error-state.js";
import type { ErrorPageType } from "../types/errors.js";
import { getElement } from "./dom.js";
import { updatePageTitle } from "./title.js";

export function showPageError(page: ErrorPageType) {
  const targetClass =
    page === "verification-session-invalid" || page === "email-already-verified"
      ? "verify-email-page"
      : page;
  const site = getElement(`.${targetClass}`);
  site.replaceChildren(ErrorState(page));
  updatePageTitle("error");
}
