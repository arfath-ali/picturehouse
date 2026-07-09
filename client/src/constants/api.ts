import type { pageCategory } from "../types/page-category.js";
import type { shelfCategoryId } from "../types/shelf-category-id.js";

export const API_ENDPOINTS = {
  REGION: "api/geo/location",

  FEATURED: (page: pageCategory) => `api/${page}/featured`,

  SHELF: (page: pageCategory, shelfCategory: shelfCategoryId) =>
    `api/${page}/shelf/${shelfCategory}`,

  DETAILS: (mediaType: string, tmdbId: string) =>
    `api/details/${mediaType}/${tmdbId}`,

  SEARCH: (query: string, searchPage: number) =>
    `api/search?query=${encodeURIComponent(query)}&searchPage=${searchPage}`,

  WATCHLIST: `api/watchlist`,
};
