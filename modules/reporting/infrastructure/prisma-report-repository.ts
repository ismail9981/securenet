import { prisma } from "@/lib/prisma";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import type {
  AlertsCsvResult,
  NetworkHealthReport,
} from "@/modules/reporting/application/report-contracts";
import type { ReportRepository } from "@/modules/reporting/application/report-repository";
import type { ReportFilters } from "@/modules/reporting/domain/report-filters";
import { calculateDocumentedHealthScore } from "@/modules/monitoring/domain/health-score";

function alertWhere(filters: ReportFilters) {
  return {
    openedAt: { gte: filters.from, lte: filters.to },
    ...(filters.deviceId ? { deviceId: filters.deviceId } : {}),
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.alertStatus ? { status: filters.alertStatus } : {}),
    ...(filters.deviceStatus
      ? { device: { status: filters.deviceStatus } }
      : {}),
  } as const;
}

function csvCell(value: string | null): string {
  if (value === null) return "";
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

const zonedFormatters = new Map<string, Intl.DateTimeFormat>();

function zonedIso(date: Date | null, timezone: string): string | null {
  if (!date) return null;
  let formatter = zonedFormatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    zonedFormatters.set(timezone, formatter);
  }
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const localAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const offsetMinutes = Math.round((localAsUtc - date.getTime()) / 60_000);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const offset = `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
}

export class PrismaReportRepository implements ReportRepository {
  async networkHealth(filters: ReportFilters): Promise<NetworkHealthReport> {
    const deviceWhere = {
      archivedAt: null,
      ...(filters.deviceId ? { id: filters.deviceId } : {}),
      ...(filters.deviceStatus ? { status: filters.deviceStatus } : {}),
    };
    const [devices, alertGroups, metrics, recentAlerts, settings] =
      await prisma.$transaction([
        prisma.device.findMany({
          where: deviceWhere,
          select: {
            id: true,
            name: true,
            hostname: true,
            status: true,
            _count: {
              select: {
                alerts: {
                  where: {
                    openedAt: { gte: filters.from, lte: filters.to },
                    ...(filters.severity ? { severity: filters.severity } : {}),
                    ...(filters.alertStatus
                      ? { status: filters.alertStatus }
                      : {
                          status: {
                            in: [
                              "OPEN",
                              "ACKNOWLEDGED",
                              "INVESTIGATING",
                            ] as const,
                          },
                        }),
                  },
                },
              },
            },
          },
        }),
        prisma.alert.groupBy({
          by: ["severity", "status"],
          where: alertWhere(filters),
          _count: true,
        }),
        prisma.deviceMetric.aggregate({
          where: {
            sourceTime: { gte: filters.from, lte: filters.to },
            ...(filters.deviceId ? { deviceId: filters.deviceId } : {}),
            ...(filters.deviceStatus
              ? { device: { status: filters.deviceStatus } }
              : {}),
          },
          _avg: {
            cpuPct: true,
            ramPct: true,
            pingMs: true,
            packetLossPct: true,
          },
          _sum: { downloadMbps: true, uploadMbps: true },
        }),
        prisma.alert.findMany({
          where: alertWhere(filters),
          include: { device: { select: { name: true } } },
          orderBy: [{ openedAt: "desc" }, { id: "desc" }],
          take: 10,
        }),
        prisma.systemSetting.findUnique({ where: { id: "global" } }),
      ]);

    const countDevice = (
      status: "ONLINE" | "DEGRADED" | "OFFLINE" | "MAINTENANCE" | "UNKNOWN",
    ) => devices.filter((device) => device.status === status).length;
    const countSeverity = (severity: "INFO" | "WARNING" | "CRITICAL") =>
      alertGroups
        .filter((group) => group.severity === severity)
        .reduce((sum, group) => sum + group._count, 0);
    const countAlertStatus = (
      status: "OPEN" | "ACKNOWLEDGED" | "INVESTIGATING" | "RESOLVED",
    ) =>
      alertGroups
        .filter((group) => group.status === status)
        .reduce((sum, group) => sum + group._count, 0);
    const health = calculateDocumentedHealthScore({
      offlineCriticalDevices: countDevice("OFFLINE"),
      openCriticalAlerts: alertGroups
        .filter(
          (group) =>
            group.severity === "CRITICAL" && group.status !== "RESOLVED",
        )
        .reduce((sum, group) => sum + group._count, 0),
      openWarningAlerts: alertGroups
        .filter(
          (group) =>
            group.severity === "WARNING" && group.status !== "RESOLVED",
        )
        .reduce((sum, group) => sum + group._count, 0),
    });

    return {
      generatedAt: new Date().toISOString(),
      from: filters.from.toISOString(),
      to: filters.to.toISOString(),
      timezone: settings?.timezone ?? "Asia/Muscat",
      trafficUnit: settings?.trafficUnit ?? "Mbps",
      demoDisclosure:
        "Deterministic Demo monitoring data; not production monitoring.",
      deviceCounts: {
        totalActive: devices.length,
        ONLINE: countDevice("ONLINE"),
        DEGRADED: countDevice("DEGRADED"),
        OFFLINE: countDevice("OFFLINE"),
        MAINTENANCE: countDevice("MAINTENANCE"),
        UNKNOWN: countDevice("UNKNOWN"),
      },
      alertsBySeverity: {
        INFO: countSeverity("INFO"),
        WARNING: countSeverity("WARNING"),
        CRITICAL: countSeverity("CRITICAL"),
      },
      alertsByStatus: {
        OPEN: countAlertStatus("OPEN"),
        ACKNOWLEDGED: countAlertStatus("ACKNOWLEDGED"),
        INVESTIGATING: countAlertStatus("INVESTIGATING"),
        RESOLVED: countAlertStatus("RESOLVED"),
      },
      metrics: {
        averageCpu: metrics._avg.cpuPct ? Number(metrics._avg.cpuPct) : null,
        averageRam: metrics._avg.ramPct ? Number(metrics._avg.ramPct) : null,
        averagePing: metrics._avg.pingMs ? Number(metrics._avg.pingMs) : null,
        averagePacketLoss: metrics._avg.packetLossPct
          ? Number(metrics._avg.packetLossPct)
          : null,
        totalDownload: Number(metrics._sum.downloadMbps ?? 0),
        totalUpload: Number(metrics._sum.uploadMbps ?? 0),
      },
      health: {
        score: health.score,
        label: health.label,
        formulaComplete: false,
      },
      topProblemDevices: devices
        .sort(
          (a, b) =>
            b._count.alerts - a._count.alerts ||
            a.hostname.localeCompare(b.hostname),
        )
        .slice(0, 10)
        .map((device) => ({
          id: device.id,
          name: device.name,
          hostname: device.hostname,
          status: device.status,
          activeAlertCount: device._count.alerts,
        })),
      recentAlerts: recentAlerts.map((alert) => ({
        id: alert.id,
        deviceName: alert.device.name,
        title: alert.title,
        severity: alert.severity,
        status: alert.status,
        openedAt: alert.openedAt.toISOString(),
      })),
    };
  }

  async alertsCsv(
    filters: ReportFilters,
    context: DeviceMutationContext,
  ): Promise<AlertsCsvResult> {
    return prisma.$transaction(async (transaction) => {
      const settings = await transaction.systemSetting.findUnique({
        where: { id: "global" },
      });
      const alerts = await transaction.alert.findMany({
        where: alertWhere(filters),
        include: {
          device: { select: { name: true, hostname: true } },
          alertRule: { select: { code: true } },
          assigneeUser: { select: { name: true } },
        },
        orderBy: [{ openedAt: "desc" }, { id: "desc" }],
        take: 10_000,
      });
      const timezone = settings?.timezone ?? "Asia/Muscat";
      const header = [
        "Alert ID",
        "Device Name",
        "Device Hostname",
        "Rule Code",
        "Severity",
        "Status",
        "Message",
        "Opened At",
        "Acknowledged At",
        "Resolved At",
        "Assignee",
        "Source",
      ];
      const lines = [
        header.map(csvCell).join(","),
        ...alerts.map((alert) =>
          [
            alert.id,
            alert.device.name,
            alert.device.hostname,
            alert.alertRule?.code ?? null,
            alert.severity,
            alert.status,
            alert.description,
            zonedIso(alert.openedAt, timezone),
            zonedIso(alert.acknowledgedAt, timezone),
            zonedIso(alert.resolvedAt, timezone),
            alert.assigneeUser?.name ?? null,
            alert.source,
          ]
            .map(csvCell)
            .join(","),
        ),
      ];
      await transaction.auditLog.create({
        data: {
          actorUserId: context.actor.id,
          action: "report.alerts.exported",
          entityType: "Report",
          entityId: "alerts",
          afterData: {
            rowCount: alerts.length,
            from: filters.from.toISOString(),
            to: filters.to.toISOString(),
          },
          ipAddress: context.requestIp,
        },
      });
      const now = new Date();
      const stamp = zonedIso(now, timezone)
        ?.slice(0, 16)
        .replace("T", "-")
        .replace(":", "");
      return {
        content: `\uFEFF${lines.join("\r\n")}\r\n`,
        filename: `securenet-alerts-${stamp}.csv`,
        rowCount: alerts.length,
      };
    });
  }
}
