import type { AlertSeverity } from "@/modules/shared/domain/network";
import type { EventType } from "@/modules/event-log/domain/event";
import type {
  AlertDeviceReference,
  AlertUserReference,
} from "@/modules/alerting/application/alert-contracts";

export interface EventAlertReference {
  readonly id: string;
  readonly title: string;
  readonly status: "OPEN" | "ACKNOWLEDGED" | "INVESTIGATING" | "RESOLVED";
}

export interface EventRecord {
  readonly id: string;
  readonly type: EventType;
  readonly severity: AlertSeverity;
  readonly message: string;
  readonly device: AlertDeviceReference | null;
  readonly alert: EventAlertReference | null;
  readonly actor: AlertUserReference | null;
  readonly simulationRun: {
    readonly id: string;
    readonly scenarioCode: string;
    readonly status: "RUNNING" | "COMPLETED" | "CANCELLED" | "FAILED";
  } | null;
  readonly createdAt: string;
}

export interface EventPage {
  readonly data: readonly EventRecord[];
  readonly meta: {
    readonly nextCursor: string | null;
  };
}
