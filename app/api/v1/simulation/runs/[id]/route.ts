import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  apiSuccess,
  authenticationRequired,
  getApiSession,
  getRequestIp,
  handleApiError,
} from "@/lib/api";
import { SimulationError } from "@/modules/simulation/application/simulation-errors";
import { simulationService } from "@/modules/simulation/infrastructure/simulation-service";

const runIdSchema = z.string().uuid();

interface Context {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    const id = runIdSchema.parse((await context.params).id);
    const run = await simulationService.getById(id, {
      actor: session.user,
      requestIp: getRequestIp(request),
    });
    if (!run) {
      throw new SimulationError(
        "SIMULATION_RUN_NOT_FOUND",
        "Simulation run was not found.",
        404,
      );
    }
    return apiSuccess(run);
  } catch (error) {
    return handleApiError(error);
  }
}
