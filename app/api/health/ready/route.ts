import { NextResponse } from "next/server";

import { checkReadiness } from "@/lib/health";
import { logEvent } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const ready = await checkReadiness({
    checkDatabase: async () => {
      await prisma.$queryRaw`SELECT 1`;
    },
  });

  if (!ready) {
    logEvent("warn", "health.readiness.failed");
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }

  return NextResponse.json({ status: "ready" });
}
