import { describe, expect, it } from "vitest";

import {
  canonicalConnectionEndpoints,
  connectedDeviceIds,
  connectionIdentity,
  topologyLinkSchema,
  type TopologyLink,
} from "@/modules/topology/domain/topology";

const link = {
  id: "60000000-0000-4000-8000-000000000001",
  sourceDeviceId: "30000000-0000-4000-8000-000000000001",
  targetDeviceId: "30000000-0000-4000-8000-000000000002",
  connectionType: "ETHERNET",
  label: null,
  bandwidthCapacityMbps: null,
  status: "ACTIVE",
} satisfies TopologyLink;

describe("Topology connection rules", () => {
  it("rejects self-links", () => {
    expect(() =>
      topologyLinkSchema.parse({
        ...link,
        targetDeviceId: link.sourceDeviceId,
      }),
    ).toThrow("itself");
    expect(() =>
      canonicalConnectionEndpoints(link.sourceDeviceId, link.sourceDeviceId),
    ).toThrow("itself");
  });

  it("uses one identity for both visual directions and separates types", () => {
    expect(
      connectionIdentity(link.sourceDeviceId, link.targetDeviceId, "ETHERNET"),
    ).toBe(
      connectionIdentity(link.targetDeviceId, link.sourceDeviceId, "ETHERNET"),
    );
    expect(
      connectionIdentity(link.sourceDeviceId, link.targetDeviceId, "VPN"),
    ).not.toBe(
      connectionIdentity(link.sourceDeviceId, link.targetDeviceId, "ETHERNET"),
    );
  });

  it("supports cycles, disconnected components, and orphan nodes", () => {
    const cycle = [
      link,
      {
        ...link,
        id: "60000000-0000-4000-8000-000000000002",
        sourceDeviceId: link.targetDeviceId,
        targetDeviceId: "30000000-0000-4000-8000-000000000003",
      },
      {
        ...link,
        id: "60000000-0000-4000-8000-000000000003",
        sourceDeviceId: link.sourceDeviceId,
        targetDeviceId: "30000000-0000-4000-8000-000000000003",
      },
    ] satisfies TopologyLink[];

    expect(connectedDeviceIds(link.sourceDeviceId, cycle)).toHaveLength(2);
    expect(
      connectedDeviceIds("30000000-0000-4000-8000-000000000099", cycle),
    ).toEqual([]);
  });
});
