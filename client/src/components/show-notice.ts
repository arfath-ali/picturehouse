import type { NoticeOptions } from "../types/notice-options.js";
import { createIcon } from "../utils/icon.js";

let showNoticeController: AbortController | null = null;
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

  showNoticeController?.abort();
  showNoticeController = new AbortController();
  const signal = showNoticeController.signal;

  removeIcon.addEventListener(
    "click",
    () => {
      const existingNotice = document.body.querySelector(".notice");
      existingNotice?.remove();
    },
    { signal },
  );

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
        notice.remove();
      },
      { once: true },
    );
  }, 3000);
}

export function cleanupShowNotice() {
  showNoticeController?.abort();
  showNoticeController = null;
}
