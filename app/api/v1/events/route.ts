import type { NextRequest } from "next/server";

import {
  apiSuccess,
  authenticationRequired,
  getApiSession,
  handleApiError,
} from "@/lib/api";
import { eventService } from "@/modules/event-log/infrastructure/event-service";
import { parseEventListQuery } from "@/modules/event-log/presentation/event-query";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    const result = await eventService.list(
      parseEventListQuery(request.nextUrl.searchParams),
      { actor: session.user },
    );
    return apiSuccess(result.data, { meta: result.meta });
  } catch (error) {
    return handleApiError(error);
  }
}
