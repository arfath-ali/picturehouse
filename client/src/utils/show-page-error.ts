import { ErrorState } from "../components/error-state.js";
import { getElement } from "./dom.js";
import { updatePageTitle } from "./title.js";

export function showPageError(page: string) {
  const site = getElement(`.${page}`);
  site.replaceChildren(ErrorState(page));
  updatePageTitle("error");
}
