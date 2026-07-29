import type { NextRequest } from "next/server";

import {
  apiSuccess,
  assertSameOrigin,
  authenticationRequired,
  getApiSession,
  getRequestIp,
  handleApiError,
  readJsonBody,
} from "@/lib/api";
import { saveTopologyPositionsSchema } from "@/modules/topology/domain/topology";
import { topologyService } from "@/modules/topology/infrastructure/topology-service";

export async function PUT(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    assertSameOrigin(request, "SAVE_TOPOLOGY_POSITIONS");
    const input = saveTopologyPositionsSchema.parse(
      await readJsonBody(request),
    );
    return apiSuccess(
      await topologyService.savePositions(input, {
        actor: session.user,
        requestIp: getRequestIp(request),
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
