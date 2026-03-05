const resolveApiBaseUrl = () => {
  const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();

  if (!configuredApiUrl) {
    return "/api";
  }

  if (typeof window === "undefined") {
    return configuredApiUrl;
  }

  try {
    const url = new URL(configuredApiUrl, window.location.origin);
    const isLocalConfiguredHost = ["localhost", "127.0.0.1"].includes(url.hostname);
    const isLocalCurrentHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

    // If app is opened from LAN IP, avoid localhost API target.
    if (isLocalConfiguredHost && !isLocalCurrentHost) {
      url.hostname = window.location.hostname;
    }

    return configuredApiUrl.startsWith("/")
      ? `${url.pathname}${url.search}${url.hash}`
      : url.toString();
  } catch {
    return "/api";
  }
};

const API_BASE_URL = resolveApiBaseUrl();
const API_KEY = import.meta.env.VITE_API_KEY || "";
const ADMIN_SETUP_KEY = import.meta.env.VITE_ADMIN_SETUP_KEY || "";

const buildHeaders = ({ auth = false, headers = {} } = {}) => {
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (API_KEY) {
    mergedHeaders["x-api-key"] = API_KEY;
  }

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) {
      mergedHeaders.Authorization = `Bearer ${token}`;
    }
  }

  return mergedHeaders;
};

const toQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: buildHeaders({ auth: options.auth, headers: options.headers }),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
};

export const api = {
  auth: {
    register: (payload) =>
      request("/auth/register", {
        method: "POST",
        body: payload,
      }),
    registerAdmin: (payload) =>
      request("/auth/register-admin", {
        method: "POST",
        headers: ADMIN_SETUP_KEY
          ? {
              "x-admin-setup-key": ADMIN_SETUP_KEY,
            }
          : {},
        body: payload,
      }),
    login: (payload) =>
      request("/auth/login", {
        method: "POST",
        body: payload,
      }),
    getMe: () =>
      request("/auth/me", {
        auth: true,
      }),
  },

  books: {
    list: (filters = {}) => request(`/books${toQueryString(filters)}`),
    getById: (id) => request(`/books/${id}`),
    suggest: (q) => request(`/books/suggest${toQueryString({ q })}`),
    create: (payload) =>
      request("/books", {
        method: "POST",
        auth: true,
        body: payload,
      }),
    update: (id, payload) =>
      request(`/books/${id}`, {
        method: "PUT",
        auth: true,
        body: payload,
      }),
    remove: (id, hard = false) =>
      request(`/books/${id}${toQueryString({ hard })}`, {
        method: "DELETE",
        auth: true,
      }),
  },

  categories: {
    list: () => request("/categories"),
    create: (payload) =>
      request("/categories", {
        method: "POST",
        auth: true,
        body: payload,
      }),
  },

  copies: {
    listByBook: (bookId) => request(`/copies/${bookId}`),
    addToBook: (bookId, copyIds) =>
      request(`/copies/${bookId}`, {
        method: "POST",
        auth: true,
        body: { copyIds },
      }),
    updateStatus: (copyId, status) =>
      request(`/copies/${copyId}`, {
        method: "PATCH",
        auth: true,
        body: { status },
      }),
    updateCode: (copyId, copyCode) =>
      request(`/copies/${copyId}`, {
        method: "PATCH",
        auth: true,
        body: { copyCode },
      }),
    remove: (copyId) =>
      request(`/copies/${copyId}`, {
        method: "DELETE",
        auth: true,
      }),
    searchByCode: (copyCode) => request(`/copies/search${toQueryString({ copyCode })}`),
  },

  users: {
    list: () =>
      request("/users", {
        auth: true,
      }),
    create: (payload) =>
      request("/users", {
        method: "POST",
        auth: true,
        body: payload,
      }),
    update: (id, payload) =>
      request(`/users/${id}`, {
        method: "PUT",
        auth: true,
        body: payload,
      }),
    remove: (id) =>
      request(`/users/${id}`, {
        method: "DELETE",
        auth: true,
      }),
  },
};

export { API_BASE_URL };
