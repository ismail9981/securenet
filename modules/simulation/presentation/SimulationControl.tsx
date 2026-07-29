"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { SimulationRunRecord } from "@/modules/simulation/application/simulation-contracts";
import {
  SCENARIOS,
  type ScenarioCode,
} from "@/modules/simulation/domain/scenarios";

interface TargetOption {
  readonly id: string;
  readonly name: string;
  readonly hostname: string;
  readonly type: string;
}

interface ApiResult {
  readonly data?: SimulationRunRecord;
  readonly error?: { readonly message?: string };
}

export function SimulationControl({
  targets,
  initialRun,
}: {
  readonly targets: readonly TargetOption[];
  readonly initialRun: SimulationRunRecord | null;
}) {
  const router = useRouter();
  const [scenarioCode, setScenarioCode] =
    useState<ScenarioCode>("SIM-CPU-OVERLOAD");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [run, setRun] = useState(initialRun);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const cancelConfirmationRef = useRef<HTMLButtonElement>(null);
  const definition = SCENARIOS[scenarioCode];
  const eligibleTargets = useMemo(
    () =>
      targets.filter(
        (target) =>
          definition.eligibleTypes === null ||
          definition.eligibleTypes.includes(
            target.type as (typeof definition.eligibleTypes)[number],
          ),
      ),
    [definition, targets],
  );

  const loadRun = useCallback(
    async (id: string) => {
      if (!id) return;
      const response = await fetch(`/api/v1/simulation/runs/${id}`, {
        credentials: "same-origin",
      });
      const result = (await response.json()) as ApiResult;
      if (response.ok && result.data) {
        setRun(result.data);
        router.refresh();
      }
    },
    [router],
  );

  useEffect(() => {
    if (confirming) cancelConfirmationRef.current?.focus();
  }, [confirming]);

  useEffect(() => {
    const refresh = (event: Event) => {
      const envelope = (event as CustomEvent).detail as {
        eventType?: string;
        payload?: unknown;
      };
      if (envelope.eventType === "simulation.status") {
        const payload = envelope.payload as { runId?: string };
        if (run && payload.runId !== run.id) return;
        void loadRun(String(payload.runId ?? run?.id ?? ""));
      } else if (
        envelope.eventType === "device.updated" ||
        envelope.eventType === "alert.created" ||
        envelope.eventType === "event.created"
      ) {
        router.refresh();
      }
    };
    window.addEventListener("securenet:realtime", refresh);
    return () => window.removeEventListener("securenet:realtime", refresh);
  }, [loadRun, router, run]);

  async function start() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/simulation/runs", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          scenarioCode,
          targetDeviceIds: selectedIds,
        }),
      });
      const result = (await response.json()) as ApiResult;
      if (!response.ok || !result.data) {
        setMessage(
          result.error?.message ?? "The scenario could not be started.",
        );
        return;
      }
      setRun(result.data);
      setMessage(`${definition.name} started.`);
      setConfirming(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function cancel() {
    if (!run) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/simulation/runs/${run.id}/cancel`, {
        method: "POST",
        credentials: "same-origin",
      });
      const result = (await response.json()) as ApiResult;
      if (!response.ok || !result.data) {
        setMessage(
          result.error?.message ?? "The scenario could not be cancelled.",
        );
        return;
      }
      setRun(result.data);
      setMessage("Scenario cancelled.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      aria-labelledby="simulation-control-heading"
      className="border-border bg-surface mt-6 rounded-2xl border p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-brand text-xs font-semibold tracking-[0.16em] uppercase">
            Administrator Demo control
          </p>
          <h2
            className="mt-1 text-lg font-semibold"
            id="simulation-control-heading"
          >
            Simulate incident
          </h2>
          <p className="text-muted mt-1 text-sm">
            Deterministic generated data only. This does not monitor real
            Devices.
          </p>
        </div>
        {run ? (
          <span className="status-badge" aria-live="polite">
            {run.status} · {run.progress}%
          </span>
        ) : null}
      </div>

      {run?.status === "RUNNING" ? (
        <div className="mt-4">
          <div
            aria-label={`Simulation progress ${run.progress}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={run.progress}
            className="bg-surface-raised h-2 overflow-hidden rounded-full"
            role="progressbar"
          >
            <div
              className="bg-brand h-full transition-[width] motion-reduce:transition-none"
              style={{ width: `${run.progress}%` }}
            />
          </div>
          <button
            className="button-secondary mt-4"
            disabled={pending}
            onClick={() => void cancel()}
            type="button"
          >
            Cancel scenario
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="text-sm font-medium">
            Scenario
            <select
              className="input mt-2 w-full"
              onChange={(event) => {
                setScenarioCode(event.target.value as ScenarioCode);
                setSelectedIds([]);
              }}
              value={scenarioCode}
            >
              {Object.values(SCENARIOS).map((scenario) => (
                <option key={scenario.code} value={scenario.code}>
                  {scenario.name} · {scenario.durationSeconds}s
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-sm font-medium">Target Devices</legend>
            <div className="border-border mt-2 max-h-36 overflow-auto rounded-xl border p-3">
              {eligibleTargets.map((target) => (
                <label
                  className="flex min-h-9 items-center gap-2 text-sm"
                  key={target.id}
                >
                  <input
                    checked={selectedIds.includes(target.id)}
                    onChange={(event) =>
                      setSelectedIds((current) =>
                        event.target.checked
                          ? [...current, target.id]
                          : current.filter((id) => id !== target.id),
                      )
                    }
                    type="checkbox"
                  />
                  <span>
                    {target.name} ({target.hostname})
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="lg:col-span-2">
            <p className="text-muted text-sm">{definition.description}</p>
            <button
              className="button-primary mt-3"
              disabled={!selectedIds.length || pending}
              onClick={() => setConfirming(true)}
              type="button"
            >
              Review and start
            </button>
          </div>
        </div>
      )}

      {message ? (
        <p aria-live="polite" className="text-muted mt-3 text-sm">
          {message}
        </p>
      ) : null}

      {confirming ? (
        <div
          aria-labelledby="simulation-confirm-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          role="dialog"
        >
          <div className="bg-surface w-full max-w-md rounded-2xl p-5 shadow-xl">
            <h3 className="text-lg font-semibold" id="simulation-confirm-title">
              Start {definition.name}?
            </h3>
            <p className="text-muted mt-2 text-sm">
              {definition.description} Duration: {definition.durationSeconds}{" "}
              seconds. Targets: {selectedIds.length}.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                className="button-secondary"
                onClick={() => setConfirming(false)}
                ref={cancelConfirmationRef}
                type="button"
              >
                Go back
              </button>
              <button
                className="button-primary"
                disabled={pending}
                onClick={() => void start()}
                type="button"
              >
                {pending ? "Starting…" : "Start scenario"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
