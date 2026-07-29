import { prisma } from "@/lib/prisma";
import type { DashboardSnapshot } from "@/modules/monitoring/application/dashboard-contracts";
import type { DashboardRepository } from "@/modules/monitoring/application/dashboard-repository";
import { calculateDocumentedHealthScore } from "@/modules/monitoring/domain/health-score";

function hourLabel(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Muscat",
  });
}

export class PrismaDashboardRepository implements DashboardRepository {
  async getSnapshot(): Promise<DashboardSnapshot> {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
    const [devices, alerts, recentAlerts, recentEvents, metrics] =
      await Promise.all([
        prisma.device.findMany({
          where: { archivedAt: null },
          select: {
            id: true,
            status: true,
            metrics: {
              orderBy: [{ sourceTime: "desc" }, { id: "desc" }],
              take: 1,
              select: { sourceTime: true },
            },
          },
        }),
        prisma.alert.groupBy({
          by: ["severity"],
          where: {
            status: { in: ["OPEN", "ACKNOWLEDGED", "INVESTIGATING"] },
          },
          _count: true,
        }),
        prisma.alert.findMany({
          where: {
            status: { in: ["OPEN", "ACKNOWLEDGED", "INVESTIGATING"] },
          },
          include: { device: { select: { name: true } } },
          orderBy: [{ openedAt: "desc" }, { id: "desc" }],
          take: 3,
        }),
        prisma.event.findMany({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 3,
        }),
        prisma.deviceMetric.findMany({
          where: {
            sourceTime: { gte: from },
            device: { archivedAt: null },
          },
          select: {
            sourceTime: true,
            downloadMbps: true,
            uploadMbps: true,
          },
          orderBy: { sourceTime: "asc" },
        }),
      ]);

    const count = (status: string) =>
      devices.filter((device) => device.status === status).length;
    const alertCount = (severity: string) =>
      alerts.find((entry) => entry.severity === severity)?._count ?? 0;
    const staleDeviceCount = devices.filter((device) => {
      const latest = device.metrics[0]?.sourceTime;
      return !latest || now.getTime() - latest.getTime() > 90_000;
    }).length;
    const summary = {
      totalDevices: devices.length,
      onlineDevices: count("ONLINE"),
      degradedDevices: count("DEGRADED"),
      offlineDevices: count("OFFLINE"),
      openCriticalAlerts: alertCount("CRITICAL"),
      openWarningAlerts: alertCount("WARNING"),
      staleDeviceCount,
    };
    const health = calculateDocumentedHealthScore({
      offlineCriticalDevices: summary.offlineDevices,
      openCriticalAlerts: summary.openCriticalAlerts,
      openWarningAlerts: summary.openWarningAlerts,
    });

    const trafficBuckets = new Map<
      number,
      { download: number; upload: number }
    >();
    for (const metric of metrics) {
      const bucket = new Date(metric.sourceTime);
      bucket.setMinutes(0, 0, 0);
      const key = bucket.getTime();
      const current = trafficBuckets.get(key) ?? { download: 0, upload: 0 };
      current.download += Number(metric.downloadMbps ?? 0);
      current.upload += Number(metric.uploadMbps ?? 0);
      trafficBuckets.set(key, current);
    }

    return {
      source: "SIMULATION_DATABASE",
      generatedAt: now.toISOString(),
      rangeLabel: "Last 24 hours · persisted Demo simulation",
      summary,
      networkHealth: {
        score: health.score,
        label: health.label,
        formulaComplete: false,
        deductionTotal: health.deductions.total,
        unresolvedFactors: [...health.unresolvedFactors],
      },
      traffic: [...trafficBuckets.entries()].map(([time, values]) => ({
        time: hourLabel(new Date(time)),
        downloadMbps: Math.round(values.download * 100) / 100,
        uploadMbps: Math.round(values.upload * 100) / 100,
      })),
      deviceDistribution: [
        { status: "ONLINE", count: summary.onlineDevices },
        { status: "DEGRADED", count: summary.degradedDevices },
        { status: "OFFLINE", count: summary.offlineDevices },
        { status: "MAINTENANCE", count: count("MAINTENANCE") },
        { status: "UNKNOWN", count: count("UNKNOWN") },
      ],
      latestAlerts: recentAlerts.map((alert) => ({
        id: alert.id,
        deviceName: alert.device.name,
        title: alert.title,
        severity: alert.severity,
        openedAt: alert.openedAt.toISOString(),
      })),
      recentEvents: recentEvents.map((event) => ({
        id: event.id.toString(),
        message: event.message,
        type: event.type,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  }
}
