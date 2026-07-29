import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  apiError,
  apiSuccess,
  assertSameOrigin,
  authenticationRequired,
  getApiSession,
  getRequestIp,
  handleApiError,
} from "@/lib/api";
import { authorizeActor } from "@/modules/identity/application/authorize";
import { acceptSimulationCommand } from "@/modules/simulation/infrastructure/simulation-rate-limit";
import { publishSimulationStatus } from "@/modules/simulation/infrastructure/simulation-realtime";
import { simulationService } from "@/modules/simulation/infrastructure/simulation-service";

const runIdSchema = z.string().uuid();

interface Context {
  readonly params: Promise<{ readonly id: string }>;
}

export async function POST(request: NextRequest, context: Context) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    authorizeActor({ actor: session.user }, "RUN_SIMULATION");
    assertSameOrigin(request, "RUN_SIMULATION");
    if (!acceptSimulationCommand(session.user.id)) {
      return apiError(
        429,
        "SIMULATION_RATE_LIMITED",
        "Too many simulation commands were submitted.",
      );
    }
    const id = runIdSchema.parse((await context.params).id);
    const run = await simulationService.cancel(id, {
      actor: session.user,
      requestIp: getRequestIp(request),
    });
    publishSimulationStatus(run);
    return apiSuccess(run);
  } catch (error) {
    return handleApiError(error);
  }
}
