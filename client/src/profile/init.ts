import { apiRequest } from "../api/api-request.js";
import { showNotice } from "../components/show-notice.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { setAppState } from "../state/app.js";
import type { ProfileResponse } from "../types/api-response.js";
import { setAuthState } from "../utils/auth-state.js";
import { getElement, getElements } from "../utils/dom.js";
import { isApiError } from "../utils/is-api-error.js";
import { handleSessionExpiration } from "../utils/session-expiration.js";

let profileController: AbortController | null = null;

export async function initProfile() {
  const profileCardsWrapper = getElement<HTMLElement>(
    "[data-js='profile-cards-wrapper']",
  );
  const profileFullNames = getElements<HTMLElement>(
    "[data-js='profile-fullname']",
  );
  const profileUsernames = getElements<HTMLElement>(
    "[data-js='profile-username']",
  );
  const profileEmail = getElement<HTMLInputElement>(
    "[data-js='profile-email']",
  );
  const passwordEditBtn = getElement<HTMLButtonElement>(
    "[data-js='edit-password-btn']",
  );
  const passwordEditCurrentField = getElement(
    "[data-js='password-edit-current-field']",
  );

  const profileAvatar = getElement<HTMLElement>("[data-js='profile-avatar']");
  const profileAvatarImg = getElement<HTMLImageElement>(
    "[data-js='profile-avatar-img']",
  );

  const googleAuthBtn = getElement<HTMLButtonElement>(
    "[data-js='google-auth-btn-connect']",
  );

  const googleAuthBtnText = getElement<HTMLButtonElement>(
    "[data-js='google-auth-btn-connect'] .btn-text",
  );

  if (window.__AUTH_STATE__?.isGoogleUser) {
    googleAuthBtn.dataset.mode = "unlink-account";
    googleAuthBtnText.textContent = "Unlink Google Account";
  }

  if (!window.__AUTH_STATE__?.hasPassword) {
    passwordEditBtn.textContent = "Set Password";
    passwordEditCurrentField.classList.add("is-hidden");
  }

  try {
    profileCardsWrapper.dataset.loading = "true";

    profileController?.abort();
    profileController = new AbortController();
    const signal = profileController.signal;

    const response = await apiRequest<ProfileResponse>(
      `${API_BASE_URL}/${API_ENDPOINTS.PROFILE}`,
      {
        method: "GET",
        credentials: "include",
        signal,
      },
    );

    if (response.success) {
      setAuthState(response);

      if (response.is_google_user) {
        googleAuthBtn.dataset.mode = "unlink-account";
        googleAuthBtnText.textContent = "Unlink Google Account";
      } else {
        googleAuthBtn.dataset.mode = "link-account";
        googleAuthBtnText.textContent = "Link Google Account";
      }

      if (!response.has_password) {
        passwordEditBtn.textContent = "Set Password";
        passwordEditCurrentField.classList.add("is-hidden");
      } else {
        passwordEditBtn.textContent = "Change Password";
        passwordEditCurrentField.classList.remove("is-hidden");
      }

      if (response.avatar_url) {
        profileAvatarImg.onload = () => {
          profileAvatar.dataset.hasAvatar = "true";
        };

        profileAvatarImg.onerror = () => {
          profileAvatar.dataset.hasAvatar = "false";
        };

        profileAvatarImg.src = response.avatar_url;
      }

      profileFullNames.forEach((profileFullName) => {
        if (profileFullName instanceof HTMLInputElement) {
          profileFullName.value = response.full_name || "";
        } else {
          profileFullName.textContent = response.full_name || "";
        }
      });

      profileUsernames.forEach((profileUsername) => {
        if (profileUsername instanceof HTMLInputElement) {
          profileUsername.value = response.username;
        } else {
          profileUsername.textContent = `@${response.username}`;
        }
      });

      if (profileEmail) {
        profileEmail.value = response.email || "";
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return;
    }

    console.error(error);

    if (isApiError(error)) {
      if (error.status === 401) {
        handleSessionExpiration();
        history.replaceState({}, "", "/home");
        navigate();
        return;
      }

      if (error.status === 404) {
        if (error.code === "USER_NOT_FOUND") {
          showNotice({
            message: error.message,
            type: "error",
          });
          history.replaceState({}, "", "/sign-in");
          navigate();
          return;
        } else {
          setAppState("not-found");
          return;
        }
      }
    }
  } finally {
    profileCardsWrapper.dataset.loading = "false";
  }
}

export function cleanupProfile() {
  profileController?.abort();
  profileController = null;
}
