import { apiRequest } from "../api/api-request.js";
import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { setAppState } from "../state/app.js";
import { authStore } from "../state/auth-store.js";
import type { ForgotPasswordResponse } from "../types/api-response.js";
import { getElement } from "../utils/dom.js";
import { startTimer } from "../utils/timer.js";
import { isApiError } from "../utils/is-api-error.js";
import { showPageError } from "../utils/show-page-error.js";
import {
  startResendingAnimation,
  stopResendingAnimation,
} from "../utils/verification-resend-btn-animation.js";
import { resetForm } from "./reset-form.js";

let resetPasswordEmailSentController: AbortController | null = null;

export function initResetPasswordEmailSent(pendingPasswordResetEmail: string) {
  resetForm();

  const resetMessage = getElement<HTMLSpanElement>(
    "[data-js='password-reset-message']",
  );
  const passwordResetEmailSpan = getElement<HTMLSpanElement>(
    "[data-js='password-reset-email']",
  );
  const passwordResetResendLinkTimer = getElement<HTMLSpanElement>(
    "[data-js='password-reset-timer']",
  );

  const passwordResetResendBtn = getElement<HTMLButtonElement>(
    "[data-js='password-reset-resend-btn']",
  );

  startTimer(passwordResetResendLinkTimer, passwordResetResendBtn);

  resetPasswordEmailSentController?.abort();
  resetPasswordEmailSentController = new AbortController();
  const signal = resetPasswordEmailSentController.signal;

  passwordResetEmailSpan.textContent =
    pendingPasswordResetEmail || "your email";
  passwordResetEmailSpan.classList.toggle(
    "auth-header__email--placeholder",
    !pendingPasswordResetEmail,
  );

  passwordResetResendBtn.addEventListener(
    "click",
    async () => {
      const resendBtnOriginalText = passwordResetResendBtn.textContent;
      startResendingAnimation(passwordResetResendBtn);

      try {
        const response = await apiRequest<ForgotPasswordResponse>(
          `${API_BASE_URL}/${API_ENDPOINTS.RESEND_PASSWORD_RESET_LINK}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: pendingPasswordResetEmail }),
            signal,
          },
        );

        if (response.success) {
          resetMessage.textContent = "We've sent a new password reset link to";
          startTimer(passwordResetResendLinkTimer, passwordResetResendBtn);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;

        console.error("Failed to resend reset link:", error);

        authStore.clearPendingPasswordResetEmail();

        if (
          isApiError(error) &&
          error.status === 404 &&
          error.code === "ROUTE_NOT_FOUND"
        ) {
          setAppState("not-found");
          return;
        }
        showPageError("reset-password-email-sent-page");
      } finally {
        stopResendingAnimation(passwordResetResendBtn, resendBtnOriginalText);
      }
    },
    { signal },
  );
}

export function cleanupResetPasswordEmailSent() {
  resetPasswordEmailSentController?.abort();
  resetPasswordEmailSentController = null;
}
