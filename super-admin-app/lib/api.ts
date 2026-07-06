const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TOKEN_KEY = "superadmin_token";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// Generic authenticated fetch wrapper.
// Attaches JWT automatically and throws on non-2xx responses,
// so calling code can just try/catch instead of checking res.ok everywhere.
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export async function loginSuperAdmin(username: string, password: string) {
  const data = await apiFetch("/auth/super-admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  saveToken(data.token);
  return data;
}

export type Organization = {
  id: string;
  name: string;
  createdAt: string;
};

export async function fetchOrganizations(): Promise<Organization[]> {
  const data = await apiFetch("/organizations", { method: "GET" });
  return data.organizations;
}

export async function createOrganization(
  name: string
): Promise<Organization> {
  const data = await apiFetch("/organizations", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return data.organization;
}
