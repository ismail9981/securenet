import { prisma } from "@/lib/prisma";
import type { AlertRuleAdminRepository } from "@/modules/alerting/application/alert-rule-admin-repository";
import type {
  AlertRuleAdminView,
  UpdateAlertRuleInput,
} from "@/modules/alerting/domain/alert-rule-admin";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";

function view(rule: {
  id: string;
  code: string;
  name: string;
  metric: string;
  operator: string;
  warningThreshold: { toNumber(): number } | null;
  criticalThreshold: { toNumber(): number } | null;
  durationSeconds: number;
  consecutiveSamples: number | null;
  enabled: boolean;
}): AlertRuleAdminView {
  return {
    ...rule,
    warningThreshold: rule.warningThreshold?.toNumber() ?? null,
    criticalThreshold: rule.criticalThreshold?.toNumber() ?? null,
  };
}

export class PrismaAlertRuleAdminRepository implements AlertRuleAdminRepository {
  async list(): Promise<readonly AlertRuleAdminView[]> {
    return (await prisma.alertRule.findMany({ orderBy: { code: "asc" } })).map(
      view,
    );
  }

  async update(
    id: string,
    input: UpdateAlertRuleInput,
    context: DeviceMutationContext,
  ): Promise<AlertRuleAdminView> {
    return prisma.$transaction(async (transaction) => {
      const before = await transaction.alertRule.findUniqueOrThrow({
        where: { id },
      });
      const data = {
        ...(input.warningThreshold !== undefined
          ? { warningThreshold: input.warningThreshold }
          : {}),
        ...(input.criticalThreshold !== undefined
          ? { criticalThreshold: input.criticalThreshold }
          : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.durationSeconds !== undefined
          ? { durationSeconds: input.durationSeconds }
          : {}),
        ...(input.consecutiveSamples !== undefined
          ? { consecutiveSamples: input.consecutiveSamples }
          : {}),
      };
      const after = await transaction.alertRule.update({
        where: { id },
        data,
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: context.actor.id,
          action: "alert_rule.updated",
          entityType: "AlertRule",
          entityId: id,
          beforeData: {
            warningThreshold: before.warningThreshold?.toString() ?? null,
            criticalThreshold: before.criticalThreshold?.toString() ?? null,
            enabled: before.enabled,
            durationSeconds: before.durationSeconds,
            consecutiveSamples: before.consecutiveSamples,
          },
          afterData: data,
          ipAddress: context.requestIp,
        },
      });
      return view(after);
    });
  }
}
