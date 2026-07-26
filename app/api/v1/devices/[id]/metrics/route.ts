import type { NextRequest } from "next/server";

import {
  apiSuccess,
  authenticationRequired,
  getApiSession,
  handleApiError,
} from "@/lib/api";
import {
  deviceIdSchema,
  metricCursorQuerySchema,
} from "@/modules/inventory/domain/device";
import { deviceService } from "@/modules/inventory/infrastructure/device-service";

interface DeviceMetricsRouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(
  request: NextRequest,
  context: DeviceMetricsRouteContext,
) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();

  try {
    const id = deviceIdSchema.parse((await context.params).id);
    const query = metricCursorQuerySchema.parse({
      cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
      limit: Number(request.nextUrl.searchParams.get("limit") ?? "24"),
    });
    const result = await deviceService.getMetrics(id, query, {
      actor: session.user,
    });
    return apiSuccess(result.data, { meta: result.meta });
  } catch (error) {
    return handleApiError(error);
  }
}
