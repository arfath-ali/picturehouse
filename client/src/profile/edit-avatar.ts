import { apiRequest } from "../api/api-request.js";
import { initHeaderAuthUI } from "../auth/header-auth-ui.js";
import { showNotice } from "../components/show-notice.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { clearAllScrollStorage } from "../scroll/window.js";
import type { ProfileAvatarEditResponse } from "../types/api-response.js";
import { notifySessionTerminated } from "../utils/auth-channel.js";
import { resetAuthState } from "../utils/auth-state.js";
import { getElement } from "../utils/dom.js";
import { isApiError } from "../utils/is-api-error.js";

let avatarEditController: AbortController | null = null;

export function initEditAvatar() {
  cleanupAvatarEdit();

  const avatarContainer = getElement<HTMLElement>("[data-js='profile-avatar']");

  const editBtn = getElement<HTMLButtonElement>(
    "[data-js='profile-avatar-edit-btn']",
  );
  const fileInput = getElement<HTMLInputElement>(
    "[data-js='profile-avatar-input']",
  );
  const avatarImg = getElement<HTMLImageElement>(
    "[data-js='profile-avatar-img']",
  );
  const removeAvatarBtn = getElement<HTMLButtonElement>(
    "[data-js='profile-avatar-remove-btn']",
  );

  avatarEditController?.abort();
  avatarEditController = new AbortController();
  const signal = avatarEditController.signal;

  editBtn.addEventListener(
    "click",
    () => {
      fileInput.click();
    },
    { signal },
  );

  fileInput.addEventListener(
    "change",
    async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showNotice({
          message: "Please select a valid image file.",
          type: "error",
        });
        fileInput.value = "";
        return;
      }

      const currentSrc = avatarImg.src;
      const currentHasAvatar = avatarContainer.dataset.hasAvatar;

      const previewUrl = URL.createObjectURL(file);
      avatarImg.src = previewUrl;
      avatarContainer.dataset.hasAvatar = "true";

      const formData = new FormData();
      formData.append("avatar", file);

      avatarContainer.dataset.isUpdating = "true";
      toggleIdentityInteractions(true);

      try {
        const response = await apiRequest<ProfileAvatarEditResponse>(
          `${API_BASE_URL}/${API_ENDPOINTS.PROFILE}/avatar`,
          {
            method: "PATCH",
            body: formData,
          },
        );

        if (response.success) {
          window.__AUTH_STATE__.avatarURL = response.avatar_url;

          avatarImg.src = response.avatar_url;
          avatarContainer.dataset.hasAvatar = "true";

          initHeaderAuthUI();

          showNotice({
            message: "Profile Picture updated successfully!",
            type: "success",
          });
        }
      } catch (error: unknown) {
        console.error(error);

        avatarImg.src = currentSrc;
        avatarContainer.dataset.hasAvatar = currentHasAvatar;

        if (isApiError(error)) {
          if (error.status === 400) {
            showNotice({
              message: error.message,
              type: "error",
            });
            return;
          }

          if (error.status === 401 || error.status === 404) {
            resetAuthState();
            notifySessionTerminated();
            clearAllScrollStorage();
            initHeaderAuthUI();

            history.replaceState({}, "", "/sign-in");
            navigate();

            showNotice({
              message:
                "Your session has expired or the account could not be found. Please sign in again.",
              type: "error",
            });
            return;
          }
        }

        showNotice({
          message: "Failed to update profile picture. Please try again.",
          type: "error",
        });
      } finally {
        URL.revokeObjectURL(previewUrl);
        fileInput.value = "";
        avatarContainer.dataset.isUpdating = "false";
        toggleIdentityInteractions(false);
      }
    },
    { signal },
  );

  removeAvatarBtn.addEventListener(
    "click",
    async () => {
      const currentSrc = avatarImg.src;
      const currentHasAvatar = avatarContainer.dataset.hasAvatar;

      avatarContainer.dataset.isUpdating = "true";
      toggleIdentityInteractions(true);

      const startTime = Date.now();
      let isPictureRemoved = false;

      try {
        const response = await apiRequest<ProfileAvatarEditResponse>(
          `${API_BASE_URL}/${API_ENDPOINTS.PROFILE}/avatar/delete`,
          {
            method: "DELETE",
          },
        );

        if (response.success) {
          window.__AUTH_STATE__.avatarURL = response.avatar_url;
          initHeaderAuthUI();

          avatarImg.src = response.avatar_url;
          avatarContainer.dataset.hasAvatar = "false";

          isPictureRemoved = true;
        }
      } catch (error: unknown) {
        console.error(error);

        avatarImg.src = currentSrc;
        avatarContainer.dataset.hasAvatar = currentHasAvatar;

        if (isApiError(error)) {
          if (error.status === 400) {
            showNotice({
              message: error.message,
              type: "error",
            });
            return;
          }

          if (error.status === 401 || error.status === 404) {
            resetAuthState();
            notifySessionTerminated();
            clearAllScrollStorage();
            initHeaderAuthUI();

            history.replaceState({}, "", "/sign-in");
            navigate();

            showNotice({
              message:
                "Your session has expired or the account could not be found. Please sign in again.",
              type: "error",
            });
            return;
          }
        }

        showNotice({
          message: "Failed to remove profile picture. Please try again.",
          type: "error",
        });
      } finally {
        const elapsed = Date.now() - startTime;

        if (elapsed < 2500) {
          await new Promise((resolve) => setTimeout(resolve, 2500 - elapsed));
        }

        avatarContainer.dataset.isUpdating = "false";
        toggleIdentityInteractions(false);

        if (isPictureRemoved) {
          showNotice({
            message: "Profile Picture removed successfully!",
            type: "success",
          });
        }
      }
    },
    { signal },
  );
}

function toggleIdentityInteractions(disabled: boolean) {
  const elements = [
    "input[data-js='profile-fullname']",
    "input[data-js='profile-username']",
    "[data-js='identity-edit-save-btn']",
    "[data-js='identity-edit-cancel-btn']",
  ];

  elements.forEach((selector) => {
    const el = document.querySelector<HTMLInputElement | HTMLButtonElement>(
      selector,
    );
    if (el) {
      el.disabled = disabled;
    }
  });
}

export function cleanupAvatarEdit() {
  avatarEditController?.abort();
  avatarEditController = null;
}
