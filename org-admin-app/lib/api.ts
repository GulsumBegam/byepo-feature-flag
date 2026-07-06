const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TOKEN_KEY = "orgadmin_token";
const ORG_NAME_KEY = "orgadmin_org_name";

export function saveSession(token: string, organizationName: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ORG_NAME_KEY, organizationName);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getOrgName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORG_NAME_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ORG_NAME_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

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

  // 204 No Content has no body to parse (used by DELETE)
  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export async function signup(
  organizationName: string,
  email: string,
  password: string
) {
  const data = await apiFetch("/auth/org-admin/signup", {
    method: "POST",
    body: JSON.stringify({ organizationName, email, password }),
  });
  saveSession(data.token, data.organization.name);
  return data;
}

export async function login(email: string, password: string) {
  const data = await apiFetch("/auth/org-admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  // Login response doesn't include org name, so we keep whatever was
  // stored before, or fall back to a generic label.
  saveSession(data.token, getOrgName() || "Your Organization");
  return data;
}

export type FeatureFlag = {
  id: string;
  key: string;
  enabled: boolean;
  createdAt: string;
};

export async function fetchFlags(): Promise<FeatureFlag[]> {
  const data = await apiFetch("/flags", { method: "GET" });
  return data.flags;
}

export async function createFlag(key: string): Promise<FeatureFlag> {
  const data = await apiFetch("/flags", {
    method: "POST",
    body: JSON.stringify({ key }),
  });
  return data.flag;
}

export async function toggleFlag(
  id: string,
  enabled: boolean
): Promise<FeatureFlag> {
  const data = await apiFetch(`/flags/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
  return data.flag;
}

export async function deleteFlag(id: string): Promise<void> {
  await apiFetch(`/flags/${id}`, { method: "DELETE" });
}
