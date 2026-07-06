const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type Organization = {
  id: string;
  name: string;
};

export async function fetchPublicOrganizations(): Promise<Organization[]> {
  const res = await fetch(`${API_URL}/organizations/public`);
  if (!res.ok) throw new Error("Failed to load organizations");
  const data = await res.json();
  return data.organizations;
}

export async function checkFeature(
  organizationId: string,
  key: string
): Promise<boolean> {
  const res = await fetch(`${API_URL}/flags/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId, key }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "Failed to check feature");
  }

  return data.enabled;
}
