const DEV_LOCAL = "http://localhost:5000";
const DEV_DOCKER = "http://localhost:8000";

const IS_DEVELOPMENT =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const API_BASE_URL =
  IS_DEVELOPMENT && window.location.port === "8000"
    ? DEV_DOCKER
    : IS_DEVELOPMENT && window.location.port === "5000"
      ? DEV_LOCAL
      : "";
