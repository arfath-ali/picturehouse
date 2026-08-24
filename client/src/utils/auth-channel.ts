import { updateWatchlistButton } from "../watchlist/button-controller.js";
import { initWatchlist } from "../watchlist/init.js";
import { initWatchlistState } from "../watchlist/state.js";

const authChannel = new BroadcastChannel("picturehouse_auth_channel");

export function notifySessionChanged(userId: string) {
  authChannel.postMessage({ type: "SESSION_CHANGED", userId });
}

export function notifySessionTerminated() {
  authChannel.postMessage({ type: "SESSION_TERMINATED" });
}

export function notifyWatchlistChanged(
  mediaId: string | number,
  isWatchlisted: boolean,
) {
  authChannel.postMessage({
    type: "WATCHLIST_CHANGED",
    mediaId,
    isWatchlisted,
  });
}

export function listenForSessionChanges() {
  authChannel.onmessage = async (event) => {
    if (event.data.type === "SESSION_CHANGED") {
      const activeUserId = window.__AUTH_STATE__?.userId ?? null;

      if (event.data.userId !== activeUserId) {
        window.location.reload();
      }
    }

    if (event.data.type === "SESSION_TERMINATED") {
      window.location.reload();
    }

    if (event.data.type === "WATCHLIST_CHANGED") {
      await initWatchlistState();
      initWatchlist();
      updateWatchlistButton(event.data.mediaId, event.data.isWatchlisted);
    }
  };
}
