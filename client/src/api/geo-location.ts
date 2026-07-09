import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";

export async function getGeoLocation() {
  try {
    const response = await fetch(`${API_BASE_URL}/${API_ENDPOINTS.REGION}`, {
      method: "GET",
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}
