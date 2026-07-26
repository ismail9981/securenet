"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function EventsError({ reset }: { readonly reset: () => void }) {
  return (
    <section className="bg-panel mx-auto max-w-2xl rounded-xl border p-6">
      <AlertTriangle aria-hidden="true" className="text-danger size-6" />
      <h1 className="mt-4 text-xl font-semibold">Events could not be loaded</h1>
      <p className="text-muted mt-2 text-sm">
        The immutable Event history request failed. Retry the read-only query.
      </p>
      <button
        className="bg-brand mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-semibold text-slate-950"
        onClick={reset}
        type="button"
      >
        <RotateCcw aria-hidden="true" className="size-4" /> Retry
      </button>
    </section>
  );
}
