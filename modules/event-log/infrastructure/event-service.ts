import { EventService } from "@/modules/event-log/application/event-service";
import { PrismaEventRepository } from "@/modules/event-log/infrastructure/prisma-event-repository";

export const eventService = new EventService(new PrismaEventRepository());
