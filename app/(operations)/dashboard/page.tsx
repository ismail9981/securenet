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
import {
  OperationalPageHeader,
  OperationalSectionHeader,
} from "@/components/foundation/OperationalPageHeader";
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
      <OperationalPageHeader
        action={<DemoDataBadge />}
        description="Monitor infrastructure health, operational state, and persisted demonstration telemetry from one authoritative workspace."
        eyebrow="Network overview"
        index="01"
        metadata={[
          { label: "Status", value: "LIVE", tone: "live" },
          { label: "Nodes", value: summary.totalDevices },
          {
            label: "Critical",
            value: summary.openCriticalAlerts,
            tone: "critical",
          },
          {
            label: "Last sync",
            value: new Date(snapshot.generatedAt).toLocaleTimeString("en-GB", {
              timeZone: "Asia/Muscat",
            }),
          },
        ]}
        title="Dashboard"
      />

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

      <OperationalSectionHeader
        index="01.1"
        title="Network health"
        description="Approved health classification and fixed deductions."
      />
      <HealthScorePanel health={snapshot.networkHealth} />

      <OperationalSectionHeader
        index="01.2"
        title="System status"
        description="Current persisted device and alert totals."
      />
      <section
        aria-label="Network summary"
        className="metric-strip sm:grid-cols-2 xl:grid-cols-5"
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

      <div className="mt-10 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <DeviceDistribution
          distribution={snapshot.deviceDistribution}
          total={summary.totalDevices}
        />
        <TrafficChart
          data={snapshot.traffic}
          rangeLabel={snapshot.rangeLabel}
        />
      </div>

      <div className="mt-6">
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
