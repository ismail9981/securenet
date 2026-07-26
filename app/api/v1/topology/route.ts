import type { NextRequest } from "next/server";

import {
  apiSuccess,
  authenticationRequired,
  getApiSession,
  handleApiError,
} from "@/lib/api";
import { topologyService } from "@/modules/topology/infrastructure/topology-service";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();

  try {
    const snapshot = await topologyService.getActiveSnapshot({
      actor: session.user,
    });
    return apiSuccess(snapshot);
  } catch (error) {
    return handleApiError(error);
  }
}
