import { z } from "zod";

import type { AlertRuleAdminRepository } from "@/modules/alerting/application/alert-rule-admin-repository";
import type {
  AlertRuleAdminView,
  UpdateAlertRuleInput,
} from "@/modules/alerting/domain/alert-rule-admin";
import {
  authorizeActor,
  type ActorContext,
} from "@/modules/identity/application/authorize";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";

const metricMaximum: Readonly<Record<string, number>> = {
  CPU: 100,
  RAM: 100,
  DISK: 100,
  PACKET_LOSS: 100,
  PING: 60_000,
  BANDWIDTH: 1_000_000,
};

function validationIssue(path: string, message: string): never {
  throw new z.ZodError([{ code: "custom", path: [path], message }]);
}

export class AlertRuleAdminService {
  constructor(private readonly repository: AlertRuleAdminRepository) {}

  list(context: ActorContext): Promise<readonly AlertRuleAdminView[]> {
    authorizeActor(context, "MANAGE_ALERT_RULES");
    return this.repository.list();
  }

  async update(
    id: string,
    input: UpdateAlertRuleInput,
    context: DeviceMutationContext,
  ): Promise<AlertRuleAdminView> {
    authorizeActor(context, "MANAGE_ALERT_RULES");
    const current = (await this.repository.list()).find(
      (rule) => rule.id === id,
    );
    if (!current) validationIssue("id", "The AlertRule does not exist.");
    if (current.code === "AR-BW-01" && input.enabled === true) {
      validationIssue(
        "enabled",
        "AR-BW-01 cannot be enabled without an approved utilization formula.",
      );
    }
    const warning =
      input.warningThreshold === undefined
        ? current.warningThreshold
        : input.warningThreshold;
    const critical =
      input.criticalThreshold === undefined
        ? current.criticalThreshold
        : input.criticalThreshold;
    const maximum = metricMaximum[current.metric];
    for (const [field, value] of [
      ["warningThreshold", warning],
      ["criticalThreshold", critical],
    ] as const) {
      if (
        value !== null &&
        (maximum === undefined || value < 0 || value > maximum)
      ) {
        validationIssue(
          field,
          `The threshold is outside the ${current.metric} range.`,
        );
      }
    }
    if (warning !== null && critical !== null && current.operator !== "EQ") {
      const increasing =
        current.operator === "GT" || current.operator === "GTE";
      if (
        (increasing && warning > critical) ||
        (!increasing && warning < critical)
      ) {
        validationIssue(
          "criticalThreshold",
          "Warning and critical thresholds are ordered incorrectly for this operator.",
        );
      }
    }
    return this.repository.update(id, input, context);
  }
}
