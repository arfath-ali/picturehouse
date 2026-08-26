import { closeDeleteAccountModal } from "./auth/delete-account.js";
import { initHeaderAuthUI } from "./auth/header-auth-ui.js";
import { checkUserSession } from "./auth/user-session.js";
import { initUserRegion } from "./config/region.js";
import {
  closeEmailEditModal,
  reopenEmailEditModal,
} from "./profile/edit-email.js";
import { initProfile } from "./profile/init.js";
import { initLinkInterceptor } from "./router/linkInterceptor.js";
import { navigate } from "./router/navigate.js";
import {
  cleanupWindowScrollManager,
  clearAllScrollStorage,
  initWindowScrollManager,
} from "./scroll/window.js";
import { listenForSessionChanges } from "./utils/auth-channel.js";
import { getElement } from "./utils/dom.js";
import { injectSprite } from "./utils/sprite.js";
import { initWatchlistState } from "./watchlist/state.js";

async function bootstrap() {
  sessionStorage.setItem("app-initialized", "true");
  await checkUserSession();

  const navEntry = window.performance?.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  const isReload = navEntry?.type === "reload";

  if (isReload || !sessionStorage.getItem("app-initialized")) {
    clearAllScrollStorage();
  }

  listenForSessionChanges();
  initLinkInterceptor();

  initHeaderAuthUI();
  initWindowScrollManager();

  await Promise.all([injectSprite(), initUserRegion()]);

  await initWatchlistState();

  await navigate();

  window.addEventListener("popstate", async (event) => {
    const emailEditModalPage = getElement("[data-js='profile-email-edit']");
    const isEmailEditModalVisible =
      emailEditModalPage?.classList.contains("is-visible");

    if (isEmailEditModalVisible) {
      closeEmailEditModal();

      if (window.location.pathname === "/profile") {
        return;
      }
    }

    const deleteModalPage = getElement("[data-js='profile-delete']");
    const isDeleteModalVisible =
      deleteModalPage?.classList.contains("is-visible");

    if (isDeleteModalVisible) {
      closeDeleteAccountModal();
      return;
    }

    await navigate();

    if (
      window.location.pathname === "/profile" &&
      event.state?.modal === "email-edit"
    ) {
      reopenEmailEditModal();
    }
  });
}

window.addEventListener("DOMContentLoaded", bootstrap, { once: true });

window.addEventListener("pageshow", async (event: PageTransitionEvent) => {
  if (!event.persisted) return;

  cleanupWindowScrollManager();
  initWindowScrollManager();
  clearAllScrollStorage();

  if (window.location.pathname === "/profile") {
    await initProfile();
  }
});
