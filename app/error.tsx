"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("SecureNet route error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section
        aria-labelledby="error-title"
        className="bg-panel w-full max-w-lg rounded-xl border p-6 text-center"
      >
        <AlertTriangle
          aria-hidden="true"
          className="text-danger mx-auto mb-4 size-8"
        />
        <p className="text-danger mb-2 text-xs font-semibold tracking-[0.16em] uppercase">
          Unable to load this view
        </p>
        <h1 id="error-title" className="text-xl font-semibold">
          The request could not be completed
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          Retry the request. If the problem continues, provide the correlation
          reference to the operator.
        </p>
        {error.digest ? (
          <p className="text-muted mt-3 font-mono text-xs">
            Reference: {error.digest}
          </p>
        ) : null}
        <button
          className="bg-brand mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-[var(--accent-primary-hover)]"
          onClick={reset}
          type="button"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          Try again
        </button>
      </section>
    </main>
  );
}
