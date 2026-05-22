const isBrowser = typeof window !== "undefined";
const isProd = process.env.NODE_ENV === "production";

export const apiBase = isProd ? "/scoring/api" : "http://localhost:5001/api";
export const socketUrl = isProd && isBrowser ? window.location.origin : "http://localhost:5001";
export const socketPath = isProd ? "/scoring/socket.io" : "/socket.io";

export async function fetchApi(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export async function fetchAuthorizedApi(path, token, options = {}) {
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  return fetchApi(path, {
    ...options,
    headers,
  });
}
