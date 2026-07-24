import { Activity } from "lucide-react";

import { PagePlaceholder } from "@/components/foundation/PagePlaceholder";

export default function DashboardPage() {
  return (
    <PagePlaceholder
      description="The P0 dashboard route and responsive shell are established. KPI summaries, Health Score, traffic trends, latest alerts, and recent events are intentionally deferred."
      eyebrow="Network overview"
      icon={Activity}
      plannedItems={[
        "Device totals and operational status summaries",
        "Deterministic Network Health Score and classification",
        "Bandwidth trend with an explicit time range",
        "Linked latest alerts and recent events",
      ]}
      requirementIds={["FR-001", "FR-002", "FR-013", "PRD-DASH-001—005"]}
      title="Dashboard"
    />
  );
}
