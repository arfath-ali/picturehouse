import type {
  ProfileResponse,
  SignInResponse,
  VerifyEmailResponse,
} from "../types/api-response.js";

export function setAuthState(
  response: SignInResponse | VerifyEmailResponse | ProfileResponse,
) {
  window.__AUTH_STATE__ = {
    isUserAuthenticated: true,
    userId: response.user_id,
    isGoogleUser: response.is_google_user,
    hasPassword: response.has_password,
    avatarURL: response.avatar_url,
  };
}

export function resetAuthState() {
  console.trace("shilpaa");
  window.__AUTH_STATE__ = {
    isUserAuthenticated: false,
    isGoogleUser: false,
    hasPassword: false,
    userId: "",
    avatarURL: null,
  };
}
