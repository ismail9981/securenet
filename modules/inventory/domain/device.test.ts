import { describe, expect, it } from "vitest";

import {
  createDeviceSchema,
  deviceListQuerySchema,
} from "@/modules/inventory/domain/device";

const validDevice = {
  name: "Test Router",
  hostname: " rtr-test-01 ",
  ipAddress: "10.90.0.1",
  macAddress: "02:ab:00:00:00:01",
  type: "ROUTER",
  status: "ONLINE",
  osName: "",
  locationId: "10000000-0000-4000-8000-000000000001",
  parentDeviceId: null,
  importanceWeight: 4,
};

describe("device boundary schemas", () => {
  it("normalizes hostname, MAC address, and nullable text", () => {
    const parsed = createDeviceSchema.parse(validDevice);

    expect(parsed.hostname).toBe("RTR-TEST-01");
    expect(parsed.macAddress).toBe("02:AB:00:00:00:01");
    expect(parsed.osName).toBeNull();
  });

  it.each(["999.1.1.1", "not-an-ip", "10.20.0"])(
    "rejects invalid IP address %s",
    (ipAddress) => {
      expect(() =>
        createDeviceSchema.parse({ ...validDevice, ipAddress }),
      ).toThrow();
    },
  );

  it("bounds and allow-lists pagination and sorting", () => {
    expect(() =>
      deviceListQuerySchema.parse({
        page: 0,
        pageSize: 101,
        sort: "createdAt",
      }),
    ).toThrow();
  });
});
