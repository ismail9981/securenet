import {
  AlertSeverity,
  AlertStatus,
  EventType,
  Prisma,
  type AlertRule,
  type DeviceMetric,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  AcceptedMetricBatch,
  AlertLifecycleResult,
  AlertPage,
  AlertRecord,
  MetricBatchEvaluationResult,
} from "@/modules/alerting/application/alert-contracts";
import {
  AlertActiveConflictError,
  AlertNotFoundError,
} from "@/modules/alerting/application/alert-errors";
import type { AlertRepository } from "@/modules/alerting/application/alert-repository";
import {
  evaluateAlertRule,
  nextAlertStatus,
  type AcknowledgeAlertInput,
  type AlertListQuery,
  type AlertRuleDefinition,
  type MetricSample,
  type ResolveAlertInput,
} from "@/modules/alerting/domain/alert";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import { DeviceNotFoundError } from "@/modules/inventory/application/device-errors";
import { isMetricStale } from "@/modules/telemetry/domain/freshness";

const activeStatuses: AlertStatus[] = [
  AlertStatus.OPEN,
  AlertStatus.ACKNOWLEDGED,
  AlertStatus.INVESTIGATING,
];

const alertInclude = {
  device: {
    select: { id: true, name: true, hostname: true, archivedAt: true },
  },
  alertRule: { select: { id: true, code: true, name: true } },
  acknowledgedBy: { select: { id: true, name: true, email: true } },
  resolvedBy: { select: { id: true, name: true, email: true } },
  assigneeUser: { select: { id: true, name: true, email: true } },
} satisfies Prisma.AlertInclude;

type AlertWithReferences = Prisma.AlertGetPayload<{
  include: typeof alertInclude;
}>;

function mapAlert(alert: AlertWithReferences): AlertRecord {
  return {
    id: alert.id,
    device: {
      id: alert.device.id,
      name: alert.device.name,
      hostname: alert.device.hostname,
      archived: alert.device.archivedAt !== null,
    },
    alertRule: alert.alertRule,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    status: alert.status,
    source: alert.source,
    openedAt: alert.openedAt.toISOString(),
    lastTriggeredAt: alert.lastTriggeredAt.toISOString(),
    acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
    acknowledgedBy: alert.acknowledgedBy,
    acknowledgementNote: alert.acknowledgementNote,
    assignee: alert.assigneeUser,
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    resolvedBy: alert.resolvedBy,
    resolutionNote: alert.resolutionNote,
  };
}

function queryWhere(query: AlertListQuery): Prisma.AlertWhereInput {
  return {
    ...(query.severities.length ? { severity: { in: query.severities } } : {}),
    ...(query.statuses.length ? { status: { in: query.statuses } } : {}),
    ...(query.deviceId ? { deviceId: query.deviceId } : {}),
    ...(query.from || query.to
      ? {
          openedAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
  };
}

function ruleDefinition(rule: AlertRule): AlertRuleDefinition {
  return {
    id: rule.id,
    code: rule.code,
    metric: rule.metric,
    operator: rule.operator,
    warningThreshold:
      rule.warningThreshold === null ? null : Number(rule.warningThreshold),
    criticalThreshold:
      rule.criticalThreshold === null ? null : Number(rule.criticalThreshold),
    durationSeconds: rule.durationSeconds,
    consecutiveSamples: rule.consecutiveSamples,
    enabled: rule.enabled,
  };
}

function storedMetricSample(
  metric: DeviceMetric,
  status: MetricSample["status"],
  now: Date,
): MetricSample {
  const number = (value: Prisma.Decimal | null) =>
    value === null ? null : Number(value);
  return {
    cpuPct: number(metric.cpuPct),
    ramPct: number(metric.ramPct),
    diskPct: number(metric.diskPct),
    pingMs: number(metric.pingMs),
    packetLossPct: number(metric.packetLossPct),
    status,
    sourceTime: metric.sourceTime,
    stale: isMetricStale(metric.sourceTime, now),
  };
}

function alertAuditSnapshot(
  alert: AlertWithReferences,
): Prisma.InputJsonObject {
  return {
    id: alert.id,
    status: alert.status,
    severity: alert.severity,
    acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
    acknowledgedById: alert.acknowledgedBy?.id ?? null,
    assigneeUserId: alert.assigneeUser?.id ?? null,
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    resolvedById: alert.resolvedBy?.id ?? null,
  };
}

async function conditionIsActive(
  transaction: Prisma.TransactionClient,
  alert: AlertWithReferences,
  now: Date,
): Promise<boolean> {
  if (!alert.alertRule) return false;
  const rule = await transaction.alertRule.findUnique({
    where: { id: alert.alertRule.id },
  });
  if (!rule || !rule.enabled) return false;

  const device = await transaction.device.findUnique({
    where: { id: alert.device.id },
    select: { id: true, hostname: true, status: true, archivedAt: true },
  });
  if (!device || device.archivedAt) return false;
  if (rule.metric === "STATUS") return device.status === "OFFLINE";

  const metrics = await transaction.deviceMetric.findMany({
    where: { deviceId: device.id },
    orderBy: [{ sourceTime: "desc" }, { id: "desc" }],
    take: 100,
  });
  return Boolean(
    evaluateAlertRule(
      ruleDefinition(rule),
      {
        id: device.id,
        hostname: device.hostname,
        status: device.status,
        archived: false,
      },
      metrics
        .map((metric) => storedMetricSample(metric, device.status, now))
        .reverse(),
    ),
  );
}

function eventMessage(
  command: "ACKNOWLEDGE" | "INVESTIGATE" | "RESOLVE",
  alert: AlertWithReferences,
  actorName: string,
): string {
  if (command === "ACKNOWLEDGE") {
    return `${actorName} acknowledged “${alert.title}”.`;
  }
  if (command === "INVESTIGATE") {
    return `${actorName} started investigating “${alert.title}”.`;
  }
  return `${actorName} resolved “${alert.title}”.`;
}

export class PrismaAlertRepository implements AlertRepository {
  async list(query: AlertListQuery): Promise<AlertPage> {
    const where = queryWhere(query);
    const [records, total, severityGroups] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: alertInclude,
        orderBy: [{ openedAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.alert.count({ where }),
      prisma.alert.groupBy({
        by: ["severity"],
        where,
        _count: { _all: true },
      }),
    ]);
    const severitySummary = {
      INFO: 0,
      WARNING: 0,
      CRITICAL: 0,
    };
    for (const group of severityGroups) {
      severitySummary[group.severity] = group._count._all;
    }
    return {
      data: records.map(mapAlert),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
        severitySummary,
      },
    };
  }

  async getById(id: string): Promise<AlertRecord | null> {
    const alert = await prisma.alert.findUnique({
      where: { id },
      include: alertInclude,
    });
    return alert ? mapAlert(alert) : null;
  }

  async listForDevice(
    deviceId: string,
    query: AlertListQuery,
  ): Promise<AlertPage> {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, archivedAt: null },
      select: { id: true },
    });
    if (!device) throw new DeviceNotFoundError();
    return this.list({ ...query, deviceId });
  }

  async acknowledge(
    id: string,
    input: AcknowledgeAlertInput,
    context: DeviceMutationContext,
  ): Promise<AlertLifecycleResult> {
    return this.transition(id, "ACKNOWLEDGE", input, context);
  }

  async investigate(
    id: string,
    context: DeviceMutationContext,
  ): Promise<AlertLifecycleResult> {
    return this.transition(id, "INVESTIGATE", {}, context);
  }

  async resolve(
    id: string,
    input: ResolveAlertInput,
    context: DeviceMutationContext,
  ): Promise<AlertLifecycleResult> {
    return this.transition(id, "RESOLVE", input, context);
  }

  private async transition(
    id: string,
    command: "ACKNOWLEDGE" | "INVESTIGATE" | "RESOLVE",
    input: AcknowledgeAlertInput | ResolveAlertInput | object,
    context: DeviceMutationContext,
  ): Promise<AlertLifecycleResult> {
    const result = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.alert.findUnique({
        where: { id },
        include: alertInclude,
      });
      if (!existing) throw new AlertNotFoundError();

      const now = new Date();
      const resolveInput =
        command === "RESOLVE" ? (input as ResolveAlertInput) : null;
      const nextStatus = nextAlertStatus({
        current: existing.status,
        command,
        role: context.actor.role,
        conditionActive:
          command === "RESOLVE"
            ? await conditionIsActive(transaction, existing, now)
            : false,
        ...(resolveInput
          ? { overrideReason: resolveInput.overrideReason }
          : {}),
      });

      const update = await transaction.alert.updateMany({
        where: { id, status: existing.status },
        data:
          command === "ACKNOWLEDGE"
            ? {
                status: nextStatus,
                acknowledgedAt: now,
                acknowledgedById: context.actor.id,
                acknowledgementNote:
                  (input as AcknowledgeAlertInput).note ?? null,
                assigneeUserId: context.actor.id,
              }
            : command === "INVESTIGATE"
              ? { status: nextStatus, assigneeUserId: context.actor.id }
              : {
                  status: nextStatus,
                  resolvedAt: now,
                  resolvedById: context.actor.id,
                  resolutionNote: resolveInput?.resolutionNote ?? null,
                },
      });
      if (update.count !== 1) {
        throw new AlertActiveConflictError();
      }

      const updated = await transaction.alert.findUniqueOrThrow({
        where: { id },
        include: alertInclude,
      });
      const type =
        command === "ACKNOWLEDGE"
          ? EventType.ALERT_ACKNOWLEDGED
          : command === "INVESTIGATE"
            ? EventType.ALERT_INVESTIGATION_STARTED
            : EventType.ALERT_RESOLVED;
      const event = await transaction.event.create({
        data: {
          deviceId: existing.device.id,
          alertId: existing.id,
          actorUserId: context.actor.id,
          type,
          severity: AlertSeverity.INFO,
          message: eventMessage(command, existing, context.actor.name),
          payload: {
            source: "USER_ACTION",
            ...(resolveInput?.overrideReason
              ? { overrideReason: resolveInput.overrideReason }
              : {}),
          },
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: context.actor.id,
          action: `alert.${command.toLowerCase()}`,
          entityType: "Alert",
          entityId: existing.id,
          beforeData: alertAuditSnapshot(existing),
          afterData: alertAuditSnapshot(updated),
          ipAddress: context.requestIp,
        },
      });
      return { alert: mapAlert(updated), eventId: event.id.toString() };
    });
    return result;
  }

  async evaluateMetricBatch(
    batch: AcceptedMetricBatch,
  ): Promise<MetricBatchEvaluationResult> {
    const rules = await prisma.alertRule.findMany({ where: { enabled: true } });
    let opened = 0;
    let retriggered = 0;

    for (const device of batch.devices) {
      for (const rule of rules) {
        const trigger = evaluateAlertRule(
          ruleDefinition(rule),
          device,
          device.samples,
        );
        if (!trigger) continue;
        const result = await this.persistTrigger(
          batch.batchKey,
          device.id,
          device.hostname,
          rule,
          trigger,
        );
        if (result === "opened") opened += 1;
        else retriggered += 1;
      }
    }
    return { opened, retriggered };
  }

  private async persistTrigger(
    batchKey: string,
    deviceId: string,
    hostname: string,
    rule: AlertRule,
    trigger: NonNullable<ReturnType<typeof evaluateAlertRule>>,
  ): Promise<"opened" | "retriggered"> {
    const persist = () =>
      prisma.$transaction(async (transaction) => {
        const active = await transaction.alert.findFirst({
          where: {
            deviceId,
            alertRuleId: rule.id,
            status: { in: activeStatuses },
          },
        });
        if (active) {
          await transaction.alert.update({
            where: { id: active.id },
            data: {
              severity: trigger.severity,
              lastTriggeredAt: trigger.triggeredAt,
            },
          });
          await transaction.event.create({
            data: {
              deviceId,
              alertId: active.id,
              type: EventType.ALERT_RETRIGGERED,
              severity: trigger.severity,
              message: `${rule.name} retriggered for ${hostname}.`,
              payload: {
                source: "METRIC_BATCH",
                batchKey,
                observedValue: String(trigger.observedValue),
                threshold: String(trigger.threshold),
              },
              createdAt: trigger.triggeredAt,
            },
          });
          return "retriggered" as const;
        }

        const alert = await transaction.alert.create({
          data: {
            deviceId,
            alertRuleId: rule.id,
            dedupeKey: `${deviceId}:${rule.id}`,
            title: `${rule.name} on ${hostname}`,
            description: `${rule.name} condition was observed on ${hostname}.`,
            severity: trigger.severity,
            status: AlertStatus.OPEN,
            source: trigger.source,
            openedAt: trigger.triggeredAt,
            lastTriggeredAt: trigger.triggeredAt,
          },
        });
        await transaction.event.create({
          data: {
            deviceId,
            alertId: alert.id,
            type: EventType.ALERT_OPENED,
            severity: trigger.severity,
            message: `${rule.name} Alert opened for ${hostname}.`,
            payload: {
              source: "METRIC_BATCH",
              batchKey,
              observedValue: String(trigger.observedValue),
              threshold: String(trigger.threshold),
            },
            createdAt: trigger.triggeredAt,
          },
        });
        return "opened" as const;
      });

    try {
      return await persist();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existing = await prisma.alert.findFirst({
          where: {
            deviceId,
            alertRuleId: rule.id,
            status: { in: activeStatuses },
          },
        });
        if (!existing) throw new AlertActiveConflictError();
        await prisma.$transaction([
          prisma.alert.update({
            where: { id: existing.id },
            data: {
              severity: trigger.severity,
              lastTriggeredAt: trigger.triggeredAt,
            },
          }),
          prisma.event.create({
            data: {
              deviceId,
              alertId: existing.id,
              type: EventType.ALERT_RETRIGGERED,
              severity: trigger.severity,
              message: `${rule.name} retriggered for ${hostname}.`,
              payload: { source: "METRIC_BATCH", batchKey },
              createdAt: trigger.triggeredAt,
            },
          }),
        ]);
        return "retriggered";
      }
      throw error;
    }
  }
}
