import { getElement } from "./dom.js";
import { setFieldErrorStatus } from "./form-ui.js";

let otpInputsController: AbortController | null = null;

export function setUpOTPInputs(
  verificationOTPInputs: HTMLInputElement[],
  handleOTPVerification: (otp: string) => void,
) {
  const verificationOTPErrorElement = getElement<HTMLSpanElement>(
    "[data-js='verification-otp-error']",
  );

  otpInputsController?.abort();
  otpInputsController = new AbortController();
  const signal = otpInputsController.signal;

  function checkOTPCompletion() {
    const otp = verificationOTPInputs.map((input) => input.value).join("");

    if (otp.length === verificationOTPInputs.length && handleOTPVerification) {
      handleOTPVerification(otp);
    }
  }

  verificationOTPInputs.forEach((input, index) => {
    input.addEventListener(
      "input",
      (e) => {
        setFieldErrorStatus(
          verificationOTPErrorElement,
          "",
          verificationOTPInputs,
        );

        const targetElement = e.target as HTMLInputElement;
        const inputValue = targetElement.value;

        targetElement.value = inputValue
          ? inputValue.charAt(inputValue.length - 1)
          : "";

        if (inputValue && index < verificationOTPInputs.length - 1) {
          verificationOTPInputs[index + 1].focus();
        }

        checkOTPCompletion();
      },
      { signal },
    );

    input.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Backspace") {
          if (!input.value && index > 0) {
            verificationOTPInputs[index - 1].focus();
            verificationOTPInputs[index - 1].value = "";
          } else {
            input.value = "";
          }

          e.preventDefault();
        }
      },
      { signal },
    );

    input.addEventListener(
      "paste",
      (e) => {
        e.preventDefault();
        setFieldErrorStatus(
          verificationOTPErrorElement,
          "",
          verificationOTPInputs,
        );

        const pasteData = e.clipboardData?.getData("text").trim() || "";
        const digits = pasteData.replace(/\D/g, "").split("");

        let currentIndex = index;

        digits.forEach((digit) => {
          if (currentIndex < verificationOTPInputs.length) {
            verificationOTPInputs[currentIndex].value = digit;
            currentIndex++;
          }
        });

        const focusIndex = Math.min(
          currentIndex,
          verificationOTPInputs.length - 1,
        );
        verificationOTPInputs[focusIndex].focus();

        checkOTPCompletion();
      },
      { signal },
    );
  });
}

export function clearOtpInputs(verificationOTPInputs: HTMLInputElement[]) {
  verificationOTPInputs.forEach((input) => {
    input.value = "";
  });

  verificationOTPInputs[0].focus();

  return;
}

export function cleanupOtpInputs() {
  otpInputsController?.abort();
  otpInputsController = null;
}
