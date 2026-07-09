import { navigate } from "./navigate.js";

export function initLinkInterceptor() {
  document.addEventListener("click", (e) => {
    const anchorLink = (e.target as HTMLElement).closest("a");
    if (!anchorLink) return;

    const isSamePage = anchorLink.pathname === window.location.pathname;

    const isExternalLink = anchorLink.origin !== window.location.origin;

    const isModifierKeyUsed = e.metaKey || e.ctrlKey || e.shiftKey;

    const opensInNewTab = anchorLink.target === "_blank";

    if (isExternalLink || isModifierKeyUsed || opensInNewTab || isSamePage) {
      if (isSamePage) {
        e.preventDefault();
      }
      return;
    }

    e.preventDefault();
    history.pushState({}, "", `${anchorLink.href}`);

    navigate();
  });
}
