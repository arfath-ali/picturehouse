import { initUserRegion } from "./config/region.js";
import { initLinkInterceptor } from "./router/linkInterceptor.js";
import { navigate } from "./router/navigate.js";
import { initHeaderScroll } from "./scroll/header.js";
import { initWindowScrollManager } from "./scroll/window.js";
import { initWatchlistState } from "./watchlist/state.js";
import { injectSprite } from "./utils/sprite.js";
import { setAppState } from "./state/app.js";
import { togglePasswordVisibilty } from "./utils/toggle-password-visibility.js";

async function bootstrap() {
  try {
    sessionStorage.setItem("app-initialized", "true");
    initWindowScrollManager();

    await Promise.all([injectSprite(), initUserRegion(), initWatchlistState()]);

    navigate();
    initLinkInterceptor();
    initHeaderScroll();
    togglePasswordVisibilty();

    window.addEventListener("popstate", () => {
      navigate();
    });
  } catch (error: any) {
    console.error("Watchlist fetch failed:", error);

    setAppState("not-found");
  }
}

window.addEventListener("DOMContentLoaded", bootstrap);
