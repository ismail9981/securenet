import { Server } from "lucide-react";

import { PagePlaceholder } from "@/components/foundation/PagePlaceholder";

export default function DevicesPage() {
  return (
    <PagePlaceholder
      description="The P0 inventory route is ready for Sprint 2 implementation. No simulated device records or management workflows are included in this foundation."
      eyebrow="Inventory"
      icon={Server}
      plannedItems={[
        "Search by device name, hostname, and IP address",
        "Filters for type, status, and location",
        "Sortable, paginated device results",
        "Responsive table-to-summary-list behavior",
      ]}
      requirementIds={["FR-003", "FR-004", "PRD-DEV-001—004", "PRD-DEV-006"]}
      title="Devices"
    />
  );
}
