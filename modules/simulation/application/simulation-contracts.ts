import { z } from "zod";

import { simulationStatusSchema } from "@/modules/shared/domain/network";
import { scenarioCodeSchema } from "@/modules/simulation/domain/scenarios";

export const startSimulationSchema = z.object({
  scenarioCode: scenarioCodeSchema,
  targetDeviceIds: z.array(z.string().uuid()).min(1).max(30),
  seed: z.number().int().min(0).max(4_294_967_295).optional(),
});

export const simulationIdempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(120)
  .regex(/^[A-Za-z0-9._:-]+$/);

export interface SimulationRunRecord {
  readonly id: string;
  readonly scenarioCode: z.infer<typeof scenarioCodeSchema>;
  readonly status: z.infer<typeof simulationStatusSchema>;
  readonly targetDeviceIds: readonly string[];
  readonly seed: number;
  readonly engineVersion: 1;
  readonly durationSeconds: number;
  readonly progress: number;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly result: Readonly<Record<string, unknown>> | null;
}

export type StartSimulationInput = z.infer<typeof startSimulationSchema>;
