"use client";

import { Archive, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ArchiveDeviceButton({
  deviceId,
  deviceName,
}: {
  readonly deviceId: string;
  readonly deviceName: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function archiveDevice() {
    const confirmed = window.confirm(
      `Archive ${deviceName}? The device will leave active inventory, but its metrics and audit history will be preserved.`,
    );
    if (!confirmed) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/devices/${deviceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const body = (await response.json()) as {
        error?: { message?: string; correlationId?: string };
      };
      if (!response.ok) {
        setError(
          `${body.error?.message ?? "The device could not be archived."}${
            body.error?.correlationId
              ? ` Reference: ${body.error.correlationId}`
              : ""
          }`,
        );
        return;
      }
      router.replace("/devices");
      router.refresh();
    } catch {
      setError("The device could not be archived. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        className="border-danger/40 text-danger hover:bg-danger/10 inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold disabled:opacity-60"
        disabled={submitting}
        onClick={() => void archiveDevice()}
        type="button"
      >
        {submitting ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Archive aria-hidden="true" className="size-4" />
        )}
        {submitting ? "Archiving…" : "Archive device"}
      </button>
      {error ? (
        <p aria-live="polite" className="text-danger mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
