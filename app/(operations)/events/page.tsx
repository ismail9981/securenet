import { ListTree } from "lucide-react";

import { PagePlaceholder } from "@/components/foundation/PagePlaceholder";

export default function EventsPage() {
  return (
    <PagePlaceholder
      description="The P0 append-only event-log route is established. Operational records, filters, and links to devices and alerts are deferred to Sprint 3."
      eyebrow="Operational history"
      icon={ListTree}
      plannedItems={[
        "Timestamped state, alert, and administrative events",
        "Search, filters, and safe pagination",
        "Direct links to associated devices and alerts",
        "Read-only operational history in the user interface",
      ]}
      requirementIds={["FR-010", "PRD-EVT-001—003"]}
      title="Events"
    />
  );
}
