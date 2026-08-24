import type { pageCategory } from "../types/page-category.js";
import type { shelfCategoryId } from "../types/shelf-category-id.js";

export const API_ENDPOINTS = {
  REGION: "api/geo/location",

  PROFILE: "api/profile",

  SIGNIN: "api/sign-in",

  SIGNOUT: "api/sign-out",

  FORGOT_PASSWORD: "api/forgot-password",

  RESEND_PASSWORD_RESET_LINK: "api/resend-password-reset-link",

  RESET_PASSWORD: "api/reset-password",

  SIGNUP: "api/sign-up",

  GOOGLE_AUTH: "api/auth/google",

  VERIFY_EMAIL: "api/verify-email",

  RESEND_VERIFICATION_EMAIL: "api/resend-verification-email",

  DELETE_ACCOUNT: "api/delete",

  USERNAME: (username: string) =>
    `api/check-username?username=${encodeURIComponent(username)}`,

  FEATURED: (page: pageCategory) => `api/${page}/featured`,

  SHELF: (page: pageCategory, shelfCategory: shelfCategoryId) =>
    `api/${page}/shelf/${shelfCategory}`,

  DETAILS: (mediaType: string, tmdbId: string) =>
    `api/details/${mediaType}/${tmdbId}`,

  SEARCH: (query: string, searchPage: number) =>
    `api/search?query=${encodeURIComponent(query)}&searchPage=${searchPage}`,

  WATCHLIST: `api/watchlist`,
};
