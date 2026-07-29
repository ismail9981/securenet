import { z } from "zod";

import type { DeviceType } from "@/modules/shared/domain/network";

export const SCENARIO_CODES = [
  "SIM-CPU-OVERLOAD",
  "SIM-RAM-LEAK",
  "SIM-ROUTER-OFFLINE",
  "SIM-PACKET-LOSS",
  "SIM-BW-SPIKE",
  "SIM-RECOVERY",
] as const;

export const scenarioCodeSchema = z.enum(SCENARIO_CODES);
export type ScenarioCode = z.infer<typeof scenarioCodeSchema>;

export interface ScenarioDefinition {
  readonly code: ScenarioCode;
  readonly name: string;
  readonly description: string;
  readonly durationSeconds: number;
  readonly eligibleTypes: readonly DeviceType[] | null;
}

export const SCENARIOS: Readonly<Record<ScenarioCode, ScenarioDefinition>> = {
  "SIM-CPU-OVERLOAD": {
    code: "SIM-CPU-OVERLOAD",
    name: "Server CPU Overload",
    description: "Raises server CPU to 92–99%, followed by gradual recovery.",
    durationSeconds: 120,
    eligibleTypes: ["SERVER"],
  },
  "SIM-RAM-LEAK": {
    code: "SIM-RAM-LEAK",
    name: "Memory Leak",
    description: "Raises RAM gradually until the critical range.",
    durationSeconds: 180,
    eligibleTypes: null,
  },
  "SIM-ROUTER-OFFLINE": {
    code: "SIM-ROUTER-OFFLINE",
    name: "Core Router Offline",
    description: "Sets the selected router Offline for the scenario duration.",
    durationSeconds: 90,
    eligibleTypes: ["ROUTER"],
  },
  "SIM-PACKET-LOSS": {
    code: "SIM-PACKET-LOSS",
    name: "High Packet Loss",
    description: "Raises packet loss to 8–25% with elevated latency.",
    durationSeconds: 120,
    eligibleTypes: null,
  },
  "SIM-BW-SPIKE": {
    code: "SIM-BW-SPIKE",
    name: "Bandwidth Spike",
    description:
      "Raises traffic and latency without calculating bandwidth utilization.",
    durationSeconds: 90,
    eligibleTypes: null,
  },
  "SIM-RECOVERY": {
    code: "SIM-RECOVERY",
    name: "Network Recovery",
    description: "Gradually restores selected Devices toward baseline.",
    durationSeconds: 60,
    eligibleTypes: null,
  },
};

export function isEligibleDeviceType(
  scenario: ScenarioDefinition,
  type: DeviceType,
): boolean {
  return (
    scenario.eligibleTypes === null || scenario.eligibleTypes.includes(type)
  );
}
