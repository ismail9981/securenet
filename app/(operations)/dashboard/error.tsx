"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error("SecureNet dashboard error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <section
      aria-labelledby="dashboard-error-title"
      className="bg-panel mx-auto max-w-xl rounded-xl border p-6 text-center"
    >
      <AlertTriangle
        aria-hidden="true"
        className="text-danger mx-auto mb-4 size-8"
      />
      <p className="text-danger mb-2 text-xs font-semibold tracking-[0.16em] uppercase">
        Demo snapshot unavailable
      </p>
      <h1 className="text-xl font-semibold" id="dashboard-error-title">
        Dashboard could not be loaded
      </h1>
      <p className="text-muted mt-3 text-sm leading-6">
        Retry the deterministic Demo snapshot. No live monitoring source is
        affected.
      </p>
      {error.digest ? (
        <p className="text-muted mt-3 font-mono text-xs">
          Reference: {error.digest}
        </p>
      ) : null}
      <button
        className="bg-brand mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-950"
        onClick={reset}
        type="button"
      >
        <RotateCcw aria-hidden="true" className="size-4" />
        Try again
      </button>
    </section>
  );
}
