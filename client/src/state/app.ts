import type { AppState } from "../types/app-state.js";
import { getElement } from "../utils/dom.js";
import { updatePageTitle } from "../utils/title.js";

const body = getElement<HTMLBodyElement>("body");

export function setAppState(state: AppState) {
  body.dataset.state = state;

  if (state === "details") {
    updatePageTitle("details", null, true);
  } else updatePageTitle(state);
}
