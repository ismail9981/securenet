import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]) },
}));

import { GET as live } from "@/app/api/health/live/route";
import { GET as ready } from "@/app/api/health/ready/route";
import { prisma } from "@/lib/prisma";

describe("public health routes", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "a".repeat(32);
    process.env.DATABASE_URL =
      "postgresql://user:password@localhost/securenet_dev";
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);
  });

  it("returns a minimal liveness response without dependencies", async () => {
    const response = live();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "live" });
  });

  it("returns a minimal readiness response without infrastructure details", async () => {
    const response = await ready();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ready" });
    expect(JSON.stringify(body)).not.toMatch(
      /database|migration|hostname|worker|secret/i,
    );
  });

  it("returns minimal 503 for invalid environment", async () => {
    delete process.env.AUTH_SECRET;
    const response = await ready();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
  });

  it("returns minimal 503 for database failure", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("private details"));
    const response = await ready();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
  });
});
