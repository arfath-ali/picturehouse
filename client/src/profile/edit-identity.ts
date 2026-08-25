import { apiRequest } from "../api/api-request.js";
import { initHeaderAuthUI } from "../auth/header-auth-ui.js";
import { showNotice } from "../components/show-notice.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { navigate } from "../router/navigate.js";
import { clearAllScrollStorage } from "../scroll/window.js";
import { setAppState } from "../state/app.js";
import type { ProfileIdentityEditResponse } from "../types/api-response.js";
import type { FormValidationResult } from "../types/form-validation-result.js";
import { notifySessionTerminated } from "../utils/auth-channel.js";
import { resetAuthState } from "../utils/auth-state.js";
import {
  checkUsernameAvailability,
  clearUsernameDebounce,
  resetUsernameStatus,
} from "../utils/check-username-availability.js";
import { getElement } from "../utils/dom.js";
import { setFieldErrorStatus } from "../utils/form-ui.js";
import { validateUsername } from "../utils/form-validation.js";
import { isApiError } from "../utils/is-api-error.js";

let identityEditController: AbortController | null = null;

export function initEditIdentity() {
  const identityEditBtn = getElement<HTMLButtonElement>(
    "[data-js='profile-edit-identity-btn']",
  );
  const profileBanner = getElement<HTMLElement>(
    "[data-js='profile-card-banner']",
  );
  const profileForm = getElement<HTMLElement>(
    "[data-js='profile-identity-form']",
  );

  const fullNameMeta = getElement<HTMLElement>(
    ".profile__user-meta [data-js='profile-fullname']",
  );

  const usernameMeta = getElement<HTMLElement>(
    ".profile__user-meta [data-js='profile-username']",
  );

  const fullNameInput = getElement<HTMLInputElement>(
    "input[data-js='profile-fullname']",
  );
  let initialFullName = "";
  let isFullNameChanged = false;

  const usernameInputRow = getElement<HTMLElement>(
    "[data-js='profile-username-row']",
  );
  const usernameInput = getElement<HTMLInputElement>(
    "input[data-js='profile-username']",
  );
  const usernameInputError = getElement<HTMLSpanElement>(
    "[data-js='profile-username-error']",
  );
  let usernameValidation: FormValidationResult = {
    message: "",
    isValid: false,
  };
  let isUsernameValid: boolean = false;
  let initialUsername = "";
  let isUsernameChanged = false;

  const submitBtn = getElement<HTMLButtonElement>(
    "[data-js='identity-edit-save-btn']",
  );

  const identityEditCancelBtn = getElement<HTMLButtonElement>(
    "[data-js='identity-edit-cancel-btn']",
  );

  identityEditController?.abort();
  identityEditController = new AbortController();
  const signal = identityEditController.signal;

  identityEditBtn.addEventListener(
    "click",
    () => {
      initialFullName = fullNameInput.value;
      initialUsername = usernameInput.value;

      profileBanner.dataset.isEditing = "true";
      profileForm.dataset.isEditing = "true";

      fullNameInput.disabled = false;
      usernameInput.disabled = false;

      fullNameInput.focus();
    },
    { signal },
  );

  function checkFormValidity() {
    const hasChanges = isFullNameChanged || isUsernameChanged;

    if (!hasChanges) {
      submitBtn.disabled = true;
      return;
    }

    if (isUsernameChanged) {
      submitBtn.disabled = !isUsernameValid;
    } else {
      submitBtn.disabled = false;
    }
  }

  fullNameInput.addEventListener(
    "input",
    () => {
      fullNameInput.value = fullNameInput.value.replace(/\s+/g, " ");

      const trimmedFullName = fullNameInput.value.trim();
      isFullNameChanged = trimmedFullName !== initialFullName;

      checkFormValidity();
    },
    { signal },
  );

  usernameInput.addEventListener(
    "input",
    async (e) => {
      submitBtn.disabled = true;

      clearUsernameDebounce(usernameInputRow);

      usernameInput.value = (e.target as HTMLInputElement).value
        .toLowerCase()
        .replace(/\s/g, "");

      const currentUsername = usernameInput.value.trim();
      isUsernameChanged = currentUsername !== initialUsername;

      setFieldErrorStatus(usernameInputError, "", usernameInput);

      if (isUsernameChanged) {
        usernameValidation = validateUsername(usernameInput.value);
        isUsernameValid = usernameValidation.isValid;

        if (isUsernameValid) {
          usernameValidation = await checkUsernameAvailability(
            usernameInputRow,
            usernameInput.value,
          );
          setFieldErrorStatus(
            usernameInputError,
            usernameValidation.message,
            usernameInput,
          );

          isUsernameValid = usernameValidation.isValid;
        }
      } else {
        usernameValidation = { isValid: true, message: "" };
        isUsernameValid = true;
      }
      checkFormValidity();
    },
    { signal },
  );

  usernameInput.addEventListener(
    "blur",
    async () => {
      setFieldErrorStatus(
        usernameInputError,
        usernameValidation.message,
        usernameInput,
      );
    },
    { signal },
  );

  submitBtn.addEventListener(
    "click",
    async (e) => {
      e.preventDefault();

      submitBtn.setAttribute("data-loading", "true");
      submitBtn.disabled = true;

      const userData = {
        full_name: fullNameInput.value,
        username: usernameInput.value,
      };

      try {
        const response = await apiRequest<ProfileIdentityEditResponse>(
          `${API_BASE_URL}/${API_ENDPOINTS.PROFILE}/identity`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          },
        );

        if (response.success) {
          initialFullName = userData.full_name;
          initialUsername = userData.username;

          fullNameMeta.textContent = userData.full_name;
          usernameMeta.textContent = `@${userData.username}`;

          isFullNameChanged = false;
          isUsernameChanged = false;

          profileBanner.dataset.isEditing = "false";
          profileForm.dataset.isEditing = "false";

          fullNameInput.disabled = true;
          usernameInput.disabled = true;

          submitBtn.disabled = true;

          showNotice({
            message: "Profile updated successfully!",
            type: "success",
          });
        }
      } catch (error: unknown) {
        console.error(error);

        if (isApiError(error)) {
          if (error.status === 400 || error.status === 409) {
            const message = error.message;

            setFieldErrorStatus(usernameInputError, message, usernameInput);

            isUsernameValid = false;
            usernameValidation = { message, isValid: false };
            resetUsernameStatus(usernameInputRow);

            usernameInput.focus();
            checkFormValidity();
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

          showNotice({
            message: "Failed to update profile. Please try again.",
            type: "error",
          });
        }
        showNotice({
          message: "Failed to update profile. Please try again.",
          type: "error",
        });
      } finally {
        submitBtn.setAttribute("data-loading", "false");
      }
    },
    { signal },
  );

  identityEditCancelBtn.addEventListener(
    "click",
    () => {
      fullNameInput.value = initialFullName;
      usernameInput.value = initialUsername;

      setFieldErrorStatus(usernameInputError, "", usernameInput);
      resetUsernameStatus(usernameInputRow);

      isFullNameChanged = false;
      isUsernameChanged = false;

      profileBanner.dataset.isEditing = "false";
      profileForm.dataset.isEditing = "false";

      fullNameInput.disabled = true;
      usernameInput.disabled = true;

      submitBtn.disabled = true;
    },
    { signal },
  );
}

export function cleanupIdentityEdit() {
  const profileBanner = getElement<HTMLElement>(
    "[data-js='profile-card-banner']",
  );
  const profileForm = getElement<HTMLElement>(
    "[data-js='profile-identity-form']",
  );

  const fullNameInput = getElement<HTMLInputElement>(
    "input[data-js='profile-fullname']",
  );

  const usernameInput = getElement<HTMLInputElement>(
    "input[data-js='profile-username']",
  );

  const submitBtn = getElement<HTMLButtonElement>(
    "[data-js='identity-edit-save-btn']",
  );

  profileBanner.dataset.isEditing = "false";
  profileForm.dataset.isEditing = "false";

  fullNameInput.disabled = true;
  usernameInput.disabled = true;

  submitBtn.disabled = true;

  identityEditController?.abort();
  identityEditController = null;
}
