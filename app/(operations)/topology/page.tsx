import { Network } from "lucide-react";

import { PagePlaceholder } from "@/components/foundation/PagePlaceholder";

export default function TopologyPage() {
  return (
    <PagePlaceholder
      description="The P0 topology route is established. Interactive nodes, connections, status encoding, keyboard support, and list fallback are deferred to Sprint 4."
      eyebrow="Network relationships"
      icon={Network}
      plannedItems={[
        "Device nodes and documented connection types",
        "Status communicated with text or icon as well as color",
        "Device summary and details navigation",
        "Accessible list alternative to the interactive canvas",
      ]}
      requirementIds={["FR-011", "PRD-TOP-001—003"]}
      title="Topology"
    />
  );
}
