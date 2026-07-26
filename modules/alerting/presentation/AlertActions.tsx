"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AlertRecord } from "@/modules/alerting/application/alert-contracts";
import type { UserRole } from "@/modules/shared/domain/network";

interface AlertActionsProps {
  readonly alert: AlertRecord;
  readonly role: UserRole;
}

export function AlertActions({ alert, role }: AlertActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const canAct = role === "ADMIN" || role === "NETWORK_ENGINEER";
  if (!canAct || alert.status === "RESOLVED" || alert.device.archived) {
    return null;
  }

  async function submit(action: "acknowledge" | "investigate" | "resolve") {
    const body: Record<string, string> = {};
    if (action === "acknowledge") {
      const note = window.prompt("Acknowledgement note (optional)")?.trim();
      if (note) body.note = note;
    }
    if (action === "resolve") {
      const resolutionNote = window
        .prompt("Resolution note (optional)")
        ?.trim();
      if (resolutionNote) body.resolutionNote = resolutionNote;
      if (role === "ADMIN" && alert.status === "OPEN") {
        const overrideReason = window
          .prompt("Administrator override reason (required)")
          ?.trim();
        if (!overrideReason) {
          setMessage("An override reason is required.");
          return;
        }
        body.overrideReason = overrideReason;
      }
    }

    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/alerts/${alert.id}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        setMessage(payload.error?.message ?? "The action could not complete.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("The action could not complete.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {alert.status === "OPEN" ? (
          <button
            className="bg-brand min-h-11 rounded-lg px-4 text-sm font-semibold text-slate-950 disabled:opacity-60"
            disabled={pending}
            onClick={() => void submit("acknowledge")}
            type="button"
          >
            Acknowledge
          </button>
        ) : null}
        {alert.status === "ACKNOWLEDGED" ? (
          <button
            className="bg-panel-raised min-h-11 rounded-lg border px-4 text-sm font-semibold disabled:opacity-60"
            disabled={pending}
            onClick={() => void submit("investigate")}
            type="button"
          >
            Start investigation
          </button>
        ) : null}
        {role === "ADMIN" || alert.status !== "OPEN" ? (
          <button
            className="border-danger/50 text-danger min-h-11 rounded-lg border px-4 text-sm font-semibold disabled:opacity-60"
            disabled={pending}
            onClick={() => void submit("resolve")}
            type="button"
          >
            Resolve
          </button>
        ) : null}
      </div>
      <p aria-live="polite" className="text-danger mt-2 text-sm">
        {message}
      </p>
    </div>
  );
}
