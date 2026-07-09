import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import type { pageCategory } from "../types/page-category.js";
import type { shelfCategoryId } from "../types/shelf-category-id.js";

export async function getMediaShelf(
  page: pageCategory,
  shelfCategory: shelfCategoryId,
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/${API_ENDPOINTS.SHELF(page, shelfCategory)}`,
      {
        method: "GET",
      },
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error: any = new Error(
        `${response.status} ${response.statusText}: ${data.error ?? "Unknown error"}`,
      );

      error.status = response.status;
      error.backendMessage = data.error;
      error.statusText = response.statusText;

      throw error;
    }
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
