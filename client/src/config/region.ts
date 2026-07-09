import { getGeoLocation } from "../api/geo-location.js";

export let USER_REGION = "IN";

const CACHE_TTL = 2 * 60 * 60 * 1000;

export async function initUserRegion() {
  try {
    const cachedData = sessionStorage.getItem("userRegionContext");

    if (cachedData) {
      const { countryCode, timestamp } = JSON.parse(cachedData);

      const isCacheExpired = Date.now() - timestamp > CACHE_TTL;

      if (!isCacheExpired) {
        USER_REGION = countryCode.toUpperCase();
        
        return;
      }
    }

    const data = await getGeoLocation();

    USER_REGION = data.countryCode.toUpperCase();

    const cachePayload = { countryCode: USER_REGION, timestamp: Date.now() };

    sessionStorage.setItem("userRegionContext", JSON.stringify(cachePayload));
  } catch (error) {
    console.warn("⚠️ initUserRegion failed. Defaulting to 'IN'.", error);
    USER_REGION = "IN";
  }
}
