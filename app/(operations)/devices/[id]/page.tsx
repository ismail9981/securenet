import { ServerCog } from "lucide-react";

import { PagePlaceholder } from "@/components/foundation/PagePlaceholder";

interface DeviceDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function DeviceDetailsPage({
  params,
}: DeviceDetailsPageProps) {
  const { id } = await params;

  return (
    <PagePlaceholder
      context={`Requested device reference: ${id}`}
      description="The dynamic P0 details route is established. Identity, latest metrics, history, associated alerts, and events will be connected in Sprint 2."
      eyebrow="Device diagnostics"
      icon={ServerCog}
      plannedItems={[
        "Identity, location, operating system, status, and last seen",
        "CPU, RAM, disk, ping, loss, bandwidth, and uptime summaries",
        "Time-range metric history",
        "Linked alert and event history with stale-data explanation",
      ]}
      requirementIds={["FR-004", "FR-005", "PRD-DD-001—005"]}
      title="Device details"
    />
  );
}
