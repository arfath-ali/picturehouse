import { apiRequest } from "../api/api-request.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { clearAllScrollStorage } from "../scroll/window.js";
import type { UserSessionResponse } from "../types/api-response.js";
import { notifySessionChanged } from "../utils/auth-channel.js";
import { resetAuthState, setAuthState } from "../utils/auth-state.js";
import { initHeaderAuthUI } from "./header-auth-ui.js";

let userSessionController: AbortController | null = null;

export async function checkUserSession() {
  userSessionController?.abort();
  userSessionController = new AbortController();

  try {
    const signal = userSessionController.signal;

    const response = await apiRequest<UserSessionResponse>(
      `${API_BASE_URL}/${API_ENDPOINTS.USER_SESSION}`,
      {
        method: "GET",
        signal,
      },
    );

    if (response.success) {
      setAuthState(response);
      notifySessionChanged(response.user_id);
      clearAllScrollStorage();
      initHeaderAuthUI();
      history.replaceState({}, "", "/home");
      navigate();
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    console.error(error);

    resetAuthState();
  }
}

export function cleanupUserSession() {
  userSessionController?.abort();
  userSessionController = null;
}
