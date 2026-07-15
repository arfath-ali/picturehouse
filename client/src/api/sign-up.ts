import { API_BASE_URL } from "../config/api.js";
import { API_ENDPOINTS } from "../constants/api.js";
import type { UserDataType } from "../types/user-data.js";

export async function signUp(userData: UserDataType) {
  try {
    const response = await fetch(`${API_BASE_URL}/${API_ENDPOINTS.SIGNUP}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json().catch(() => {});

    if (!response.ok) {
      const error: any = new Error(
        `${response.status} ${response.statusText}: ${data.error ?? "Unknown error"}`,
      );

      error.status = response.status;
      error.backendMessage = data.error;
      error.statusText = response.statusText;

      throw error;
    }
    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
