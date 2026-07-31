import {
  AlertTriangle,
  CircleCheck,
  CircleDashed,
  Server,
  ServerOff,
} from "lucide-react";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { isPortfolioMode } from "@/lib/runtime-environment";
import { DemoDataBadge } from "@/components/foundation/DemoDataBadge";
import { requireServerSession } from "@/modules/identity/infrastructure/server-session";
import { getDashboardSnapshot } from "@/modules/monitoring/application/get-dashboard-snapshot";
import { PrismaDashboardRepository } from "@/modules/monitoring/infrastructure/prisma-dashboard-repository";
import {
  LatestAlerts,
  RecentEvents,
} from "@/modules/monitoring/presentation/ActivityLists";
import { DeviceDistribution } from "@/modules/monitoring/presentation/DeviceDistribution";
import { HealthScorePanel } from "@/modules/monitoring/presentation/HealthScorePanel";
import { KpiCard } from "@/modules/monitoring/presentation/KpiCard";
import { TrafficChart } from "@/modules/monitoring/presentation/TrafficChart";
import { SimulationControl } from "@/modules/simulation/presentation/SimulationControl";
import { simulationRepository } from "@/modules/simulation/infrastructure/simulation-service";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireServerSession();
  const snapshot = await getDashboardSnapshot(
    new PrismaDashboardRepository(),
    session.user.role,
  );
  const { summary } = snapshot;
  const portfolioMode = isPortfolioMode();

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
            Persisted deterministic Demo simulation ·{" "}
            {new Date(snapshot.generatedAt).toLocaleString("en-GB", {
              timeZone: "Asia/Muscat",
            })}
          </p>
        </div>
        <DemoDataBadge />
      </header>

      {session.user.role === "ADMIN" && !portfolioMode ? (
        <SimulationControl
          initialRun={(await simulationRepository.listRunning()).at(-1) ?? null}
          targets={await prisma.device.findMany({
            where: { archivedAt: null, status: { not: "MAINTENANCE" } },
            select: { id: true, name: true, hostname: true, type: true },
            orderBy: { name: "asc" },
          })}
        />
      ) : null}

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
        traffic, alerts, events, and documented Health Score deductions come
        from persisted deterministic Demo data, not real Devices. The Health
        Score formula remains incomplete for packet loss, ping, and
        degraded-device ratio.
      </p>
    </div>
  );
}
