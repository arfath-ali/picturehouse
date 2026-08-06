const authChannel = new BroadcastChannel("picturehouse_auth_channel");

export function notifySessionChanged(userId: string) {
  authChannel.postMessage({ type: "SESSION_CHANGED", userId });
}

export function notifySignOut() {
  authChannel.postMessage({ type: "SIGNED_OUT" });
}

export function listenForSessionChanges() {
  authChannel.onmessage = (event) => {
    if (event.data.type === "SESSION_CHANGED") {
      const activeUserId = window.__AUTH_STATE__?.userId ?? null;

      if (event.data.userId !== activeUserId) {
        window.location.reload();
      }
    }

    if (event.data.type === "SIGNED_OUT") {
      window.location.reload();
    }
  };
}
