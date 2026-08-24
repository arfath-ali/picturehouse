import type { NoticeOptions } from "../types/notice-options.js";
import { createIcon } from "../utils/icon.js";

let timeoutId: ReturnType<typeof setTimeout> | null = null;

export function showNotice({ message, type }: NoticeOptions) {
  const existingNotice = document.body.querySelector(".notice");
  existingNotice?.remove();

  const noticeContainer = document.createElement("div");
  noticeContainer.classList.add("notice", `notice--${type}`);

  const notice = document.createElement("p");
  notice.textContent = message;

  const removeIcon = createIcon("icon-remove", [
    "notice__icon",
    `notice__icon--${type}`,
  ]);

  removeIcon.addEventListener("click", () => {
    if (timeoutId) clearTimeout(timeoutId);
    noticeContainer.remove();
  });

  noticeContainer.append(notice, removeIcon);
  document.body.appendChild(noticeContainer);

  requestAnimationFrame(() => {
    noticeContainer.classList.add("is-visible");
  });

  if (timeoutId) clearTimeout(timeoutId);

  timeoutId = setTimeout(() => {
    noticeContainer.classList.remove("is-visible");

    noticeContainer.addEventListener(
      "transitionend",
      () => {
        noticeContainer.remove();
      },
      { once: true },
    );
  }, 5000);
}

export function cleanupShowNotice() {
  if (timeoutId) clearTimeout(timeoutId);
  const existingNotice = document.body.querySelector(".notice");
  existingNotice?.remove();
}
