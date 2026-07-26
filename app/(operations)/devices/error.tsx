"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function DevicesError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error("Device route failed", {
      name: error.name,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="bg-panel mx-auto max-w-2xl rounded-xl border p-6">
      <AlertTriangle aria-hidden="true" className="text-danger size-6" />
      <h1 className="mt-4 text-xl font-semibold">
        Device data could not be loaded
      </h1>
      <p className="text-muted mt-2 text-sm leading-6">
        The database request failed. Retry the request; if it continues, use the
        reference below when reviewing server logs.
      </p>
      {error.digest ? (
        <p className="text-muted mt-3 font-mono text-xs">
          Reference: {error.digest}
        </p>
      ) : null}
      <button
        className="bg-brand mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-950"
        onClick={reset}
        type="button"
      >
        <RotateCcw aria-hidden="true" className="size-4" />
        Retry
      </button>
    </div>
  );
}
