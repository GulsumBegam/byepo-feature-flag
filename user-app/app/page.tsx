"use client";

import { useEffect, useState } from "react";
import {
  fetchPublicOrganizations,
  checkFeature,
  Organization,
} from "@/lib/api";

export default function CheckPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [key, setKey] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  useEffect(() => {
    fetchPublicOrganizations()
      .then((orgs) => {
        setOrganizations(orgs);
        if (orgs.length > 0) setOrganizationId(orgs[0].id);
      })
      .catch(() => setError("Could not load organizations"))
      .finally(() => setLoadingOrgs(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId || !key.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const enabled = await checkFeature(organizationId, key.trim());
      setResult(enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-sm">
      <h1 className="text-lg font-semibold text-center mb-1">
        Check Feature Status
      </h1>
      <p className="text-sm text-zinc-500 text-center mb-6">
        See if a feature is enabled for your organization
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Organization
          </label>
          <select
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            disabled={loadingOrgs || organizations.length === 0}
            className="w-full border border-zinc-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-800 bg-white"
          >
            {organizations.length === 0 && (
              <option>No organizations available</option>
            )}
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Feature key
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="dark_mode"
            required
            className="w-full border border-zinc-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-800 font-mono text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || organizations.length === 0}
          className="w-full bg-zinc-900 text-white rounded py-2 font-medium hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Check"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-4">
          {error}
        </p>
      )}

      {result !== null && (
        <div className="mt-6 flex justify-center">
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              result
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-zinc-100 text-zinc-600 border border-zinc-200"
            }`}
          >
            {result ? "Enabled" : "Disabled"}
          </span>
        </div>
      )}
    </div>
  );
}
