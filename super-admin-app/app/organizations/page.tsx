"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isLoggedIn,
  clearToken,
  fetchOrganizations,
  createOrganization,
  Organization,
} from "@/lib/api";

export default function OrganizationsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [newOrgName, setNewOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    loadOrgs();
  }, [router]);

  async function loadOrgs() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOrganizations();
      setOrgs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setCreating(true);
    setError("");
    try {
      const org = await createOrganization(newOrgName.trim());
      setOrgs((prev) => [org, ...prev]);
      setNewOrgName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setCreating(false);
    }
  }

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Organizations</h2>
        <button
          onClick={handleLogout}
          className="text-sm text-zinc-500 hover:text-zinc-800 underline"
        >
          Log out
        </button>
      </div>

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-lg shadow p-6 flex gap-3"
      >
        <input
          type="text"
          value={newOrgName}
          onChange={(e) => setNewOrgName(e.target.value)}
          placeholder="New organization name"
          className="flex-1 border border-zinc-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-800"
        />
        <button
          type="submit"
          disabled={creating}
          className="bg-zinc-900 text-white rounded px-4 py-2 font-medium hover:bg-zinc-800 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-white rounded-lg shadow divide-y divide-zinc-100">
        {loading ? (
          <p className="p-6 text-sm text-zinc-500">Loading...</p>
        ) : orgs.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">
            No organizations yet. Create one above.
          </p>
        ) : (
          orgs.map((org) => (
            <div key={org.id} className="p-4 flex items-center justify-between">
              <span className="font-medium">{org.name}</span>
              <span className="text-xs text-zinc-400">
                {new Date(org.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
