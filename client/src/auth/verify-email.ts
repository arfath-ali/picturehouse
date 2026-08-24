import { navigate } from "../router/navigate.js";
import { setAppState } from "../state/app.js";
import { authStore } from "../state/auth-store.js";
import { getElement, getElements } from "../utils/dom.js";
import { setFieldErrorStatus } from "../utils/form-ui.js";
import { clearOtpInputs, setUpOTPInputs } from "../utils/otp.js";
import { showPageError } from "../utils/show-page-error.js";
import {
  startResendingAnimation,
  stopResendingAnimation,
} from "../utils/verification-resend-btn-animation.js";
import { startTimer } from "../utils/timer.js";
import { apiRequest } from "../api/api-request.js";
import { API_ENDPOINTS } from "../constants/api.js";
import { API_BASE_URL } from "../config/api.js";
import type {
  ResendVerificationEmailResponse,
  VerifyEmailResponse,
} from "../types/api-response.js";
import { isApiError } from "../utils/is-api-error.js";
import { initHeaderAuthUI } from "./header-auth-ui.js";
import { notifySessionChanged } from "../utils/auth-channel.js";
import { resetForm } from "./reset-form.js";
import { setAuthState } from "../utils/auth-state.js";
import { showNotice } from "../components/show-notice.js";
import { closeEmailEditModal } from "../profile/edit-email.js";

let emailVerificationController: AbortController | null = null;

export function initEmailVerification(pendingVerificationEmail: string) {
  resetForm();

  const searchParams = new URLSearchParams(window.location.search);
  const source = searchParams.get("source") || "";

  const verificationMessage = getElement<HTMLSpanElement>(
    "[data-js='verification-message']",
  );
  const verificationEmail = getElement<HTMLSpanElement>(
    "[data-js='verification-email']",
  );
  const verificationOTPInputs = getElements<HTMLInputElement>(
    "[data-js='verification-otp-container'] [data-js='verification-otp-input']",
  );

  const verificationOTPErrorElement = getElement<HTMLSpanElement>(
    "[data-js='verification-otp-error']",
  );

  const verificationResendBtn = getElement<HTMLButtonElement>(
    "[data-js='verification-resend-btn']",
  );

  const verificationTimer = getElement<HTMLSpanElement>(
    "[data-js='verification-timer']",
  );

  const submitBtn = getElement<HTMLButtonElement>(
    "[data-js='verification-submit-btn']",
  );

  startTimer(verificationTimer, verificationResendBtn);

  emailVerificationController?.abort();
  emailVerificationController = new AbortController();
  const signal = emailVerificationController.signal;

  verificationEmail.textContent = pendingVerificationEmail;
  verificationEmail.classList.toggle(
    "auth-header__email--placeholder",
    pendingVerificationEmail === "<your-email@example.com>",
  );

  setUpOTPInputs(verificationOTPInputs, async (otp) => {
    submitBtn.dataset.loading = "true";
    try {
      const response = await apiRequest<VerifyEmailResponse>(
        `${API_BASE_URL}/${API_ENDPOINTS.VERIFY_EMAIL}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: pendingVerificationEmail,
            otp,
            source,
          }),
        },
      );

      if (response.success) {
        authStore.clearPendingVerificationEmail();

        if (source === "profile") {
          closeEmailEditModal();
          window.__AUTH_STATE__.isGoogleUser = false;
          history.replaceState({}, "", "/profile");
          navigate();
          showNotice({
            message: "Email updated successfully.",
            type: "success",
          });
        } else {
          setAuthState(response);
          notifySessionChanged(response.user_id);
          initHeaderAuthUI();
          history.replaceState({}, "", "/home");
          navigate();
        }
      }
    } catch (error: unknown) {
      console.error(error);

      if (isApiError(error)) {
        if (error.status === 400) {
          if (
            error.code === "VERIFICATION_SESSION_INVALID" ||
            error.code === "EMAIL_ALREADY_VERIFIED"
          ) {
            handleFatalAuthError(error.code);
          } else {
            setFieldErrorStatus(
              verificationOTPErrorElement,
              error.message,
              verificationOTPInputs,
            );
            clearOtpInputs(verificationOTPInputs);
          }
        } else if (error.status === 404) {
          setAppState("not-found");
        } else {
          showPageError("verify-email-page");
        }
      } else {
        showPageError("verify-email-page");
      }
    } finally {
      submitBtn.dataset.loading = "false";
    }
  });

  verificationResendBtn.addEventListener(
    "click",
    async () => {
      setFieldErrorStatus(verificationOTPErrorElement);

      verificationOTPInputs.forEach((input) => {
        input.disabled = true;
      });

      const resendBtnOriginalText = verificationResendBtn.textContent;
      startResendingAnimation(verificationResendBtn);

      try {
        const response = await apiRequest<ResendVerificationEmailResponse>(
          `${API_BASE_URL}/${API_ENDPOINTS.RESEND_VERIFICATION_EMAIL}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: pendingVerificationEmail }),
          },
        );

        if (response.success) {
          verificationMessage.textContent =
            "We've sent a new verification code to";
          startTimer(verificationTimer, verificationResendBtn);
        }
      } catch (error: unknown) {
        console.error(error);

        if (isApiError(error)) {
          if (error.status === 400) {
            if (
              error.code === "VERIFICATION_SESSION_INVALID" ||
              error.code === "EMAIL_ALREADY_VERIFIED"
            ) {
              handleFatalAuthError(error.code);
            } else {
              setFieldErrorStatus(verificationOTPErrorElement, error.message);
              clearOtpInputs(verificationOTPInputs);
            }
          } else if (error.status === 404) {
            setAppState("not-found");
          } else {
            showPageError("verify-email-page");
          }
        } else {
          showPageError("verify-email-page");
        }
      } finally {
        stopResendingAnimation(verificationResendBtn, resendBtnOriginalText);
        verificationOTPInputs.forEach((input) => {
          input.disabled = false;
        });
      }
    },
    { signal },
  );
}

export function cleanupEmailVerification() {
  emailVerificationController?.abort();
  emailVerificationController = null;
}

function handleFatalAuthError(
  code: "EMAIL_ALREADY_VERIFIED" | "VERIFICATION_SESSION_INVALID",
) {
  authStore.clearPendingVerificationEmail();

  if (code === "EMAIL_ALREADY_VERIFIED") {
    showPageError("email-already-verified");
  } else {
    showPageError("verification-session-invalid");
  }
}
