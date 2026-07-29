import { Settings } from "lucide-react";
import type { Metadata } from "next";

import { alertRuleAdminService } from "@/modules/alerting/infrastructure/alert-rule-admin-service";
import { hasPermission } from "@/modules/identity/domain/permissions";
import { requireServerSession } from "@/modules/identity/infrastructure/server-session";
import { settingsService } from "@/modules/settings/infrastructure/settings-service";
import { SettingsConsole } from "@/modules/settings/presentation/SettingsConsole";

export const metadata: Metadata = { title: "Settings" };

const matrix = [
  ["View reports and historical metrics", "Yes", "Yes", "Yes"],
  ["Export Alerts CSV", "Yes", "Yes", "Yes"],
  ["Change global settings", "Yes", "No", "No"],
  ["Manage AlertRules", "Yes", "No", "No"],
  ["Save topology layout", "Yes", "No", "No"],
  ["Manage Devices", "Yes", "No", "No"],
  ["Acknowledge and resolve Alerts", "Yes", "Yes", "No"],
] as const;

export default async function SettingsPage() {
  const session = await requireServerSession();
  const actor = { actor: session.user };
  const canManage = hasPermission(session.user.role, "MANAGE_SETTINGS");
  const [settings, rules] = await Promise.all([
    settingsService.get(actor),
    canManage ? alertRuleAdminService.list(actor) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header>
        <div className="border-brand/25 bg-brand/10 text-brand mb-4 flex size-11 items-center justify-center rounded-xl border">
          <Settings aria-hidden="true" className="size-5" />
        </div>
        <p className="text-brand text-xs font-semibold tracking-[0.16em] uppercase">
          Global Demo configuration
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Settings</h1>
      </header>

      <SettingsConsole
        canManage={canManage}
        initialRules={rules}
        initialSettings={settings}
      />

      <section aria-labelledby="role-matrix">
        <h2 className="mb-3 text-xl font-semibold" id="role-matrix">
          Read-only role matrix
        </h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="bg-panel w-full min-w-[38rem] text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3">Capability</th>
                <th className="p-3">Administrator</th>
                <th className="p-3">Network Engineer</th>
                <th className="p-3">Viewer</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr className="border-b last:border-0" key={row[0]}>
                  {row.map((cell) => (
                    <td className="p-3" key={cell}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
