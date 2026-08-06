import { initHeaderAuthUI } from "./auth/header-auth-ui.js";
import { initUserRegion } from "./config/region.js";
import { initLinkInterceptor } from "./router/linkInterceptor.js";
import { navigate } from "./router/navigate.js";
import {
  cleanupWindowScrollManager,
  clearAllScrollStorage,
  initWindowScrollManager,
} from "./scroll/window.js";
import { listenForSessionChanges } from "./utils/auth-channel.js";
import { injectSprite } from "./utils/sprite.js";
import { initWatchlistState } from "./watchlist/state.js";

async function bootstrap() {
  sessionStorage.setItem("app-initialized", "true");
  listenForSessionChanges();
  initLinkInterceptor();

  initHeaderAuthUI();
  initWindowScrollManager();

  await Promise.all([injectSprite(), initUserRegion()]);

  await initWatchlistState();

  await navigate();

  window.addEventListener("popstate", async () => {
    await navigate();
  });
}

window.addEventListener("DOMContentLoaded", bootstrap, { once: true });

window.addEventListener("pageshow", async (event: PageTransitionEvent) => {
  if (event.persisted) {
    cleanupWindowScrollManager();

    initWindowScrollManager();

    clearAllScrollStorage();
  }
});
