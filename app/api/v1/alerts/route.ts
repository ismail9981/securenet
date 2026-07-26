import type { NextRequest } from "next/server";

import {
  apiSuccess,
  authenticationRequired,
  getApiSession,
  handleApiError,
} from "@/lib/api";
import { alertService } from "@/modules/alerting/infrastructure/alert-service";
import { parseAlertListQuery } from "@/modules/alerting/presentation/alert-query";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    const result = await alertService.list(
      parseAlertListQuery(request.nextUrl.searchParams),
      { actor: session.user },
    );
    return apiSuccess(result.data, { meta: result.meta });
  } catch (error) {
    return handleApiError(error);
  }
}
