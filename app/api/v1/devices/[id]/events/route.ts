import type { NextRequest } from "next/server";

import {
  apiSuccess,
  authenticationRequired,
  getApiSession,
  handleApiError,
} from "@/lib/api";
import { eventService } from "@/modules/event-log/infrastructure/event-service";
import { parseEventListQuery } from "@/modules/event-log/presentation/event-query";
import { deviceIdSchema } from "@/modules/inventory/domain/device";

interface Context {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    const id = deviceIdSchema.parse((await context.params).id);
    const result = await eventService.listForDevice(
      id,
      parseEventListQuery(request.nextUrl.searchParams),
      { actor: session.user },
    );
    return apiSuccess(result.data, { meta: result.meta });
  } catch (error) {
    return handleApiError(error);
  }
}
