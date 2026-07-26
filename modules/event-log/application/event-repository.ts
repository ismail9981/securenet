import type { EventPage } from "@/modules/event-log/application/event-contracts";
import type { EventListQuery } from "@/modules/event-log/domain/event";

export interface EventRepository {
  list(query: EventListQuery): Promise<EventPage>;
  listForDevice(deviceId: string, query: EventListQuery): Promise<EventPage>;
}
