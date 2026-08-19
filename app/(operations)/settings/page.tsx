import type { Metadata } from "next";

import { OperationalPageHeader } from "@/components/foundation/OperationalPageHeader";

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
      <OperationalPageHeader
        description="Review global display configuration, AlertRule thresholds, and the effective role-capability matrix."
        eyebrow="System administration"
        index="07"
        metadata={[
          { label: "Access", value: canManage ? "MANAGE" : "READ ONLY" },
          { label: "Timezone", value: settings.timezone },
          { label: "Traffic", value: settings.trafficUnit },
          { label: "Rules", value: canManage ? rules.length : "RESTRICTED" },
        ]}
        title="Settings"
      />

      <SettingsConsole
        canManage={canManage}
        initialRules={rules}
        initialSettings={settings}
      />

      <section aria-labelledby="role-matrix">
        <h2 className="mb-3 text-xl font-semibold" id="role-matrix">
          Read-only role matrix
        </h2>
        <div className="overflow-x-auto border">
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
