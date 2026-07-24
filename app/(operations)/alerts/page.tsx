import { Siren } from "lucide-react";

import { PagePlaceholder } from "@/components/foundation/PagePlaceholder";

export default function AlertsPage() {
  return (
    <PagePlaceholder
      description="The P0 alert-management route is established. Alert generation, deduplication, acknowledgement, investigation, and resolution logic remain outside Sprint 0."
      eyebrow="Incident response"
      icon={Siren}
      plannedItems={[
        "Severity, status, device, and time filtering",
        "Rule and source context for every alert",
        "Actor- and timestamp-aware acknowledgement",
        "Audited resolution with optional operator note",
      ]}
      requirementIds={["FR-007—009", "PRD-ALT-001—004"]}
      title="Alerts"
    />
  );
}
