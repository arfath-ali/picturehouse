let resendAnimationInterval: ReturnType<typeof setInterval> | null = null;

export function startResendingAnimation(resendBtn: HTMLButtonElement) {
  let dots = 1;
  const baseText = "Resending";

  if (resendAnimationInterval) clearInterval(resendAnimationInterval);

  resendBtn.textContent = baseText + ".".repeat(dots);

  resendAnimationInterval = setInterval(() => {
    dots = (dots % 3) + 1;
    resendBtn.textContent = baseText + ".".repeat(dots);
  }, 400);
}

export function stopResendingAnimation(
  resendBtn: HTMLButtonElement,
  resendBtnOriginalText: string,
) {
  if (resendAnimationInterval) {
    clearInterval(resendAnimationInterval);
    resendAnimationInterval = null;
  }
  resendBtn.textContent = resendBtnOriginalText;
}
