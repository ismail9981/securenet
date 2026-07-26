"use client";

export default function TopologyError({
  reset,
}: {
  readonly reset: () => void;
}) {
  return (
    <div className="bg-panel mx-auto max-w-2xl rounded-xl border p-8 text-center">
      <h1 className="text-xl font-semibold">Topology could not be loaded</h1>
      <p className="text-muted mt-2 text-sm">
        The active graph snapshot is temporarily unavailable.
      </p>
      <button
        className="bg-brand mt-5 min-h-11 rounded-lg px-4 font-semibold text-slate-950"
        onClick={reset}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}
