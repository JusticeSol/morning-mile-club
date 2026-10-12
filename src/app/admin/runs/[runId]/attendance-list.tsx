"use client";

import { useOptimistic, useState, useTransition } from "react";
import { inputClass, Message } from "@/components/ui";
import type { PaceGroup } from "@/lib/types";
import { setAttendance } from "../../actions";

export type AttendanceRow = {
  id: string;
  name: string;
  short: string;
  pace: PaceGroup | null;
  method: "qr" | "admin" | null;
  at: string | null;
  km: number | null;
};

export function AttendanceList({ runId, rows }: { runId: string; rows: AttendanceRow[] }) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(rows, (current, change: { id: string; present: boolean }) =>
    current.map((r) =>
      r.id === change.id ? { ...r, method: change.present ? (r.method ?? "admin") : null } : r,
    ),
  );

  const toggle = (row: AttendanceRow) => {
    const present = !row.method;
    if (!present && row.method === "qr" && !confirm(`Remove ${row.short}'s QR check-in?`)) return;
    setError(null);
    startTransition(async () => {
      setOptimistic({ id: row.id, present });
      const result = await setAttendance(runId, row.id, present);
      if (result?.error) setError(result.error);
    });
  };

  const q = query.trim().toLowerCase();
  const shown = q ? optimistic.filter((r) => r.name.toLowerCase().includes(q)) : optimistic;

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${rows.length} members`}
        aria-label="Search members"
        className={inputClass}
      />
      {error && <Message tone="error">{error}</Message>}
      <ul className="divide-y divide-navy/10">
        {shown.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => toggle(row)}
              aria-pressed={!!row.method}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold ${
                  row.method ? "border-teal bg-teal text-white" : "border-navy/20 text-transparent"
                }`}
                aria-hidden
              >
                ✓
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{row.name}</span>
                <span className="block text-sm text-navy/60">
                  {row.pace ?? "—"}
                  {row.method && ` · ${row.method === "qr" ? "scanned" : "ticked"}${row.at ? ` ${row.at}` : ""}`}
                </span>
              </span>
              {row.km != null && <span className="font-display text-lg font-bold">{row.km.toFixed(1)} km</span>}
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="py-3 text-navy/60">No members match “{query}”.</li>}
      </ul>
    </div>
  );
}
