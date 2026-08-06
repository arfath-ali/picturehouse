let timerInterval: ReturnType<typeof setInterval> | null = null;

export function startTimer(
  timerElement: HTMLSpanElement,
  resendBtnElement: HTMLButtonElement,
) {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  let timeLeft = 60;

  timerElement.textContent = `in ${timeLeft}s`;
  resendBtnElement.disabled = true;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerElement.textContent = `in ${timeLeft}s`;

    if (timeLeft <= 0) {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      timerElement.textContent = "";
      resendBtnElement.disabled = false;
    }
  }, 1000);
}
