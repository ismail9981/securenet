import { z } from "zod";

import {
  deviceStatusSchema,
  deviceTypeSchema,
} from "@/modules/shared/domain/network";

export const networkConnectionTypeSchema = z.enum([
  "ETHERNET",
  "WIFI",
  "VPN",
  "VIRTUAL",
]);

export const networkConnectionStatusSchema = z.enum([
  "ACTIVE",
  "DEGRADED",
  "DOWN",
]);

export type NetworkConnectionType = z.infer<typeof networkConnectionTypeSchema>;
export type NetworkConnectionStatus = z.infer<
  typeof networkConnectionStatusSchema
>;

export const topologyNodeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  hostname: z.string().min(1).max(120),
  type: deviceTypeSchema,
  status: deviceStatusSchema,
});

export const topologyLinkSchema = z
  .object({
    id: z.string().uuid(),
    sourceDeviceId: z.string().uuid(),
    targetDeviceId: z.string().uuid(),
    connectionType: networkConnectionTypeSchema,
    label: z.string().max(120).nullable(),
    bandwidthCapacityMbps: z.number().positive().nullable(),
    status: networkConnectionStatusSchema,
  })
  .superRefine((link, context) => {
    if (link.sourceDeviceId === link.targetDeviceId) {
      context.addIssue({
        code: "custom",
        path: ["targetDeviceId"],
        message: "A connection cannot link a Device to itself.",
      });
    }
  });

export const topologySnapshotSchema = z.object({
  generatedAt: z.string().datetime(),
  nodes: z.array(topologyNodeSchema),
  links: z.array(topologyLinkSchema).max(60),
});

export type TopologyNode = z.infer<typeof topologyNodeSchema>;
export type TopologyLink = z.infer<typeof topologyLinkSchema>;
export type TopologySnapshot = z.infer<typeof topologySnapshotSchema>;

export function canonicalConnectionEndpoints(
  firstDeviceId: string,
  secondDeviceId: string,
): readonly [string, string] {
  if (firstDeviceId === secondDeviceId) {
    throw new Error("A connection cannot link a Device to itself.");
  }
  return firstDeviceId.localeCompare(secondDeviceId) < 0
    ? [firstDeviceId, secondDeviceId]
    : [secondDeviceId, firstDeviceId];
}

export function connectionIdentity(
  firstDeviceId: string,
  secondDeviceId: string,
  connectionType: NetworkConnectionType,
): string {
  const [source, target] = canonicalConnectionEndpoints(
    firstDeviceId,
    secondDeviceId,
  );
  return `${source}:${target}:${connectionType}`;
}

export function connectedDeviceIds(
  nodeId: string,
  links: readonly TopologyLink[],
): readonly string[] {
  return links
    .flatMap((link) =>
      link.sourceDeviceId === nodeId
        ? [link.targetDeviceId]
        : link.targetDeviceId === nodeId
          ? [link.sourceDeviceId]
          : [],
    )
    .sort();
}
