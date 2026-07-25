import {
  AlertTriangle,
  CircleCheck,
  CircleDashed,
  Server,
  ServerOff,
} from "lucide-react";
import type { Metadata } from "next";

import { DemoDataBadge } from "@/components/foundation/DemoDataBadge";
import { requireServerSession } from "@/modules/identity/infrastructure/server-session";
import { getDashboardSnapshot } from "@/modules/monitoring/application/get-dashboard-snapshot";
import { DemoDashboardRepository } from "@/modules/monitoring/infrastructure/demo-dashboard-repository";
import {
  LatestAlerts,
  RecentEvents,
} from "@/modules/monitoring/presentation/ActivityLists";
import { DeviceDistribution } from "@/modules/monitoring/presentation/DeviceDistribution";
import { HealthScorePanel } from "@/modules/monitoring/presentation/HealthScorePanel";
import { KpiCard } from "@/modules/monitoring/presentation/KpiCard";
import { TrafficChart } from "@/modules/monitoring/presentation/TrafficChart";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireServerSession();
  const snapshot = await getDashboardSnapshot(
    new DemoDashboardRepository(),
    session.user.role,
  );
  const { summary } = snapshot;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-brand text-xs font-semibold tracking-[0.16em] uppercase">
            Network overview
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-muted mt-2 text-sm">
            Deterministic Sprint 1 fixture · Snapshot 24 Jul 2026, 12:00
            Asia/Muscat
          </p>
        </div>
        <DemoDataBadge />
      </header>

      <section
        aria-label="Network summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <KpiCard
          icon={Server}
          label="Total devices"
          tone="brand"
          value={summary.totalDevices}
        />
        <KpiCard
          icon={CircleCheck}
          label="Online devices"
          tone="success"
          value={summary.onlineDevices}
        />
        <KpiCard
          icon={CircleDashed}
          label="Degraded devices"
          tone="warning"
          value={summary.degradedDevices}
        />
        <KpiCard
          icon={ServerOff}
          label="Offline devices"
          tone="danger"
          value={summary.offlineDevices}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Critical alerts"
          tone="danger"
          value={summary.openCriticalAlerts}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <HealthScorePanel health={snapshot.networkHealth} />
        <TrafficChart
          data={snapshot.traffic}
          rangeLabel={snapshot.rangeLabel}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <DeviceDistribution
          distribution={snapshot.deviceDistribution}
          total={summary.totalDevices}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <LatestAlerts alerts={snapshot.latestAlerts} />
          <RecentEvents events={snapshot.recentEvents} />
        </div>
      </div>

      <p className="mt-6 border-t pt-4 text-xs leading-5 text-[var(--text-subtle)]">
        No values on this page come from live monitoring. Device counts,
        traffic, alerts, events, and health inputs are fixed Demo fixtures.
      </p>
    </div>
  );
}
