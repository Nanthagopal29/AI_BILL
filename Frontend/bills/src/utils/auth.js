const resolveApiBaseUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:7500`;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const getToken = () => localStorage.getItem("authToken");

export const getAuthHeaders = (includeJson = true) => {
  const headers = {};
  const token = getToken();

  if (includeJson) {
    headers["Content-Type"] = "application/json";
    headers.Accept = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
};
