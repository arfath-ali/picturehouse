import { apiRequest } from "../api/api-request.js";
import { API_ENDPOINTS } from "../constants/api.js";
import type { GeoLocationResponse } from "../types/api-response.js";
import { API_BASE_URL } from "./api.js";

export let USER_REGION = "IN";

const CACHE_TTL = 2 * 60 * 60 * 1000;

export async function initUserRegion() {
  const cachedData = sessionStorage.getItem("userRegionContext");

  if (cachedData) {
    const { countryCode, timestamp } = JSON.parse(cachedData);

    const isCacheExpired = Date.now() - timestamp > CACHE_TTL;

    if (!isCacheExpired) {
      USER_REGION = countryCode.toUpperCase();

      return;
    }
  }

  try {
    const response = await apiRequest<GeoLocationResponse>(
      `${API_BASE_URL}/${API_ENDPOINTS.REGION}`,
      {
        method: "GET",
      },
    );

    USER_REGION = response.countryCode.toUpperCase();

    const cachePayload = { countryCode: USER_REGION, timestamp: Date.now() };

    sessionStorage.setItem("userRegionContext", JSON.stringify(cachePayload));
  } catch (error) {
    console.warn("⚠️ initUserRegion failed. Defaulting to 'IN'.", error);
    USER_REGION = "IN";
  }
}
