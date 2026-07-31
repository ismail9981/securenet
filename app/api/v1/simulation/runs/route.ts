import type { NextRequest } from "next/server";

import {
  apiError,
  apiSuccess,
  assertSameOrigin,
  authenticationRequired,
  getApiSession,
  getRequestIp,
  handleApiError,
  readJsonBody,
} from "@/lib/api";
import { isPortfolioMode } from "@/lib/runtime-environment";
import { authorizeActor } from "@/modules/identity/application/authorize";
import { SimulationError } from "@/modules/simulation/application/simulation-errors";
import {
  simulationIdempotencyKeySchema,
  startSimulationSchema,
} from "@/modules/simulation/application/simulation-contracts";
import { acceptSimulationCommand } from "@/modules/simulation/infrastructure/simulation-rate-limit";
import { publishSimulationStatus } from "@/modules/simulation/infrastructure/simulation-realtime";
import { simulationService } from "@/modules/simulation/infrastructure/simulation-service";
import { SCENARIO_CODES } from "@/modules/simulation/domain/scenarios";

export async function POST(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  if (isPortfolioMode()) {
    return apiError(
      503,
      "SIMULATION_WORKER_UNAVAILABLE",
      "Simulation is unavailable in the Portfolio Demo deployment.",
    );
  }
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
    const idempotencyKey = simulationIdempotencyKeySchema.parse(
      request.headers.get("idempotency-key"),
    );
    const body = await readJsonBody(request);
    if (
      body &&
      typeof body === "object" &&
      "scenarioCode" in body &&
      typeof body.scenarioCode === "string" &&
      !SCENARIO_CODES.includes(
        body.scenarioCode as (typeof SCENARIO_CODES)[number],
      )
    ) {
      throw new SimulationError(
        "SIMULATION_SCENARIO_UNSUPPORTED",
        "The requested simulation scenario is not supported.",
        400,
      );
    }
    const input = startSimulationSchema.parse(body);
    const run = await simulationService.start(input, idempotencyKey, {
      actor: session.user,
      requestIp: getRequestIp(request),
    });
    publishSimulationStatus(run);
    return apiSuccess(run, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
