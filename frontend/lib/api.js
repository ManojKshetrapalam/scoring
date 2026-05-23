const isBrowser = typeof window !== "undefined";
const isProd = process.env.NODE_ENV === "production";

const devApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/** In production, use same-origin /scoring/api (rewrites or unified server). In dev, hit Express directly. */
export const apiBase = isProd ? "/scoring/api" : devApiBase;
export const socketUrl = isProd && isBrowser ? window.location.origin : "http://localhost:5001";
export const socketPath = isProd ? "/scoring/socket.io" : "/socket.io";

export async function fetchApi(path, options = {}) {
  const url = `${apiBase}${path}`;
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const preview = (await response.text()).slice(0, 120);
    throw new Error(
      `API returned HTML instead of JSON (${response.status} ${url}). ` +
        "Restart the backend (cd backend && npm run dev) so new routes like /api/teams are loaded. " +
        `Preview: ${preview}`,
    );
  }

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
