import { ErrorState } from "../components/error-state.js";
import { searchInlineError } from "../components/search-inline-error.js";
import { getElement } from "./dom.js";

export function showSearchInlineError() {
  const search = getElement(".search");

  while (search.children.length > 1) {
    search.removeChild(search.lastElementChild!);
  }
  search.appendChild(searchInlineError());
}
