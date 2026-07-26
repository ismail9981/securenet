import type { NextRequest } from "next/server";

import {
  apiSuccess,
  authenticationRequired,
  getApiSession,
  handleApiError,
} from "@/lib/api";
import { alertService } from "@/modules/alerting/infrastructure/alert-service";
import { parseAlertListQuery } from "@/modules/alerting/presentation/alert-query";
import { deviceIdSchema } from "@/modules/inventory/domain/device";

interface Context {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    const id = deviceIdSchema.parse((await context.params).id);
    const result = await alertService.listForDevice(
      id,
      parseAlertListQuery(request.nextUrl.searchParams),
      { actor: session.user },
    );
    return apiSuccess(result.data, { meta: result.meta });
  } catch (error) {
    return handleApiError(error);
  }
}
