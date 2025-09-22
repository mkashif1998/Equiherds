import { jwtDecode } from "jwt-decode";

// Store only the token
export const updateLocalStorageData = (data) => {
  localStorage.setItem("token", data.token);
  window.dispatchEvent(new Event("localStorageDataUpdate"));
};

// Decode token and return the user data
export const getUserData = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const decoded = jwtDecode(token);
    return decoded || null;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};
