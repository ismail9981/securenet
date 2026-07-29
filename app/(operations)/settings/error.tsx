"use client";

export default function SettingsError({
  reset,
}: {
  readonly reset: () => void;
}) {
  return (
    <div className="bg-panel rounded-xl border p-6">
      <h1 className="font-semibold">Settings unavailable</h1>
      <button
        className="text-brand mt-3 min-h-11"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}
