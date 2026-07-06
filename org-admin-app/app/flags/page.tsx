"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isLoggedIn,
  clearSession,
  getOrgName,
  fetchFlags,
  createFlag,
  toggleFlag,
  deleteFlag,
  FeatureFlag,
} from "@/lib/api";

export default function FlagsPage() {
  const router = useRouter();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setOrgName(getOrgName() || "Your Organization");
    loadFlags();
  }, [router]);

  async function loadFlags() {
    setLoading(true);
    setError("");
    try {
      setFlags(await fetchFlags());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load flags");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim()) return;

    setCreating(true);
    setError("");
    try {
      const flag = await createFlag(newKey.trim());
      setFlags((prev) => [flag, ...prev]);
      setNewKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create flag");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(flag: FeatureFlag) {
    setError("");
    try {
      const updated = await toggleFlag(flag.id, !flag.enabled);
      setFlags((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update flag");
    }
  }

  async function handleDelete(flag: FeatureFlag) {
    setError("");
    try {
      await deleteFlag(flag.id);
      setFlags((prev) => prev.filter((f) => f.id !== flag.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete flag");
    }
  }

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{orgName}</h2>
          <p className="text-sm text-zinc-500">Feature flags</p>
        </div>
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
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="new_feature_key"
          className="flex-1 border border-zinc-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-800 font-mono text-sm"
        />
        <button
          type="submit"
          disabled={creating}
          className="bg-zinc-900 text-white rounded px-4 py-2 font-medium hover:bg-zinc-800 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </form>
      <p className="text-xs text-zinc-400 -mt-4">
        Use lowercase letters, numbers, and underscores (e.g. dark_mode)
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-white rounded-lg shadow divide-y divide-zinc-100">
        {loading ? (
          <p className="p-6 text-sm text-zinc-500">Loading...</p>
        ) : flags.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">
            No feature flags yet. Create one above.
          </p>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.id}
              className="p-4 flex items-center justify-between"
            >
              <span className="font-mono text-sm">{flag.key}</span>

              <div className="flex items-center gap-4">
                {/* Toggle switch */}
                <button
                  onClick={() => handleToggle(flag)}
                  aria-pressed={flag.enabled}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    flag.enabled ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      flag.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleDelete(flag)}
                  className="text-zinc-400 hover:text-red-600 text-sm"
                  aria-label={`Delete ${flag.key}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
