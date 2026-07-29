"use client";

import { useState } from "react";

import type { AlertRuleAdminView } from "@/modules/alerting/domain/alert-rule-admin";
import type { SystemSettingView } from "@/modules/settings/domain/settings";

export function SettingsConsole({
  canManage,
  initialRules,
  initialSettings,
}: {
  readonly canManage: boolean;
  readonly initialRules: readonly AlertRuleAdminView[];
  readonly initialSettings: SystemSettingView;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [rules, setRules] = useState(initialRules);
  const [message, setMessage] = useState("");

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving settings…");
    const response = await fetch("/api/v1/settings", {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        timezone: settings.timezone,
        cpuUnit: settings.cpuUnit,
        memoryUnit: settings.memoryUnit,
        trafficUnit: settings.trafficUnit,
      }),
    });
    setMessage(
      response.ok ? "Settings saved." : "Settings could not be saved.",
    );
  }

  async function saveRule(rule: AlertRuleAdminView) {
    setMessage(`Saving ${rule.code}…`);
    const response = await fetch(`/api/v1/alert-rules/${rule.id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        warningThreshold: rule.warningThreshold,
        criticalThreshold: rule.criticalThreshold,
        enabled: rule.enabled,
        durationSeconds: rule.durationSeconds,
        consecutiveSamples: rule.consecutiveSamples,
      }),
    });
    setMessage(
      response.ok ? `${rule.code} saved.` : `${rule.code} was rejected.`,
    );
  }

  return (
    <div className="space-y-8">
      {!canManage ? (
        <p className="bg-panel text-muted rounded-xl border p-4">
          Read-only settings access. Administrator permission is required for
          changes.
        </p>
      ) : null}
      <p aria-live="polite" className="text-brand min-h-5 text-sm">
        {message}
      </p>

      <form className="bg-panel rounded-xl border p-5" onSubmit={saveSettings}>
        <h2 className="text-xl font-semibold">Global display settings</h2>
        <p className="text-muted mt-1 text-sm">
          Presentation only. Stored historical values and timestamps are never
          rewritten.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-muted mb-1 block">Timezone</span>
            <select
              className="bg-panel-raised min-h-11 w-full rounded-lg border px-3"
              disabled={!canManage}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  timezone: event.target.value as SystemSettingView["timezone"],
                })
              }
              value={settings.timezone}
            >
              <option>Asia/Muscat</option>
              <option>UTC</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-muted mb-1 block">Traffic unit</span>
            <select
              className="bg-panel-raised min-h-11 w-full rounded-lg border px-3"
              disabled={!canManage}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  trafficUnit: event.target
                    .value as SystemSettingView["trafficUnit"],
                })
              }
              value={settings.trafficUnit}
            >
              <option>Mbps</option>
              <option>Gbps</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-muted mb-1 block">CPU unit</span>
            <input
              className="bg-panel-raised min-h-11 w-full rounded-lg border px-3"
              disabled
              value={settings.cpuUnit}
            />
          </label>
          <label className="text-sm">
            <span className="text-muted mb-1 block">Memory unit</span>
            <input
              className="bg-panel-raised min-h-11 w-full rounded-lg border px-3"
              disabled
              value={settings.memoryUnit}
            />
          </label>
        </div>
        {canManage ? (
          <button
            className="bg-brand mt-5 min-h-11 rounded-lg px-4 font-semibold text-slate-950"
            type="submit"
          >
            Save global settings
          </button>
        ) : null}
      </form>

      {canManage ? (
        <section>
          <h2 className="text-xl font-semibold">AlertRule controls</h2>
          <p className="text-muted mt-1 text-sm">
            Rule identity, metric, operator, and scope are immutable. AR-BW-01
            remains disabled.
          </p>
          <div className="mt-4 grid gap-4">
            {rules.map((rule, index) => (
              <div className="bg-panel rounded-xl border p-5" key={rule.id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{rule.name}</h3>
                    <p className="text-muted text-xs">
                      {rule.code} · {rule.metric} · {rule.operator}
                    </p>
                  </div>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      checked={rule.enabled}
                      disabled={rule.code === "AR-BW-01"}
                      onChange={(event) =>
                        setRules(
                          rules.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, enabled: event.target.checked }
                              : item,
                          ),
                        )
                      }
                      type="checkbox"
                    />
                    Enabled
                  </label>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      ["Warning threshold", "warningThreshold"],
                      ["Critical threshold", "criticalThreshold"],
                      ["Duration seconds", "durationSeconds"],
                      ["Consecutive samples", "consecutiveSamples"],
                    ] as const
                  ).map(([label, field]) => (
                    <label className="text-sm" key={field}>
                      <span className="text-muted mb-1 block">{label}</span>
                      <input
                        className="bg-panel-raised min-h-11 w-full rounded-lg border px-3"
                        min="0"
                        onChange={(event) => {
                          const value =
                            event.target.value === ""
                              ? null
                              : Number(event.target.value);
                          setRules(
                            rules.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, [field]: value }
                                : item,
                            ),
                          );
                        }}
                        type="number"
                        value={rule[field] ?? ""}
                      />
                    </label>
                  ))}
                </div>
                <button
                  className="bg-brand mt-4 min-h-11 rounded-lg px-4 font-semibold text-slate-950"
                  onClick={() => void saveRule(rule)}
                  type="button"
                >
                  Save {rule.code}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
