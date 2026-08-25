const DEV_LOCAL = "http://localhost:5000";
const DEV_DOCKER = "http://localhost:8000";
const PROD_RENDER = "https://picturehouse-backend.onrender.com";

const IS_DEVELOPMENT =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const API_BASE_URL = IS_DEVELOPMENT
  ? window.location.port === "8000"
    ? DEV_DOCKER
    : DEV_LOCAL
  : import.meta.env.VITE_API_BASE_URL || PROD_RENDER;
