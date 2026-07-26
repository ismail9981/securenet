import {
  authorizeActor,
  type ActorContext,
} from "@/modules/identity/application/authorize";
import type { EventPage } from "@/modules/event-log/application/event-contracts";
import type { EventRepository } from "@/modules/event-log/application/event-repository";
import type { EventListQuery } from "@/modules/event-log/domain/event";

export class EventService {
  constructor(private readonly repository: EventRepository) {}

  async list(query: EventListQuery, context: ActorContext): Promise<EventPage> {
    authorizeActor(context, "VIEW_EVENTS");
    return this.repository.list(query);
  }

  async listForDevice(
    deviceId: string,
    query: EventListQuery,
    context: ActorContext,
  ): Promise<EventPage> {
    authorizeActor(context, "VIEW_EVENTS");
    return this.repository.listForDevice(deviceId, query);
  }
}
