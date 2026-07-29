import { NextResponse, type NextRequest } from "next/server";

import {
  authenticationRequired,
  getApiSession,
  getRequestIp,
  handleApiError,
} from "@/lib/api";
import { parseReportFilters } from "@/modules/reporting/domain/report-filters";
import { reportService } from "@/modules/reporting/infrastructure/report-service";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    const result = await reportService.alertsCsv(
      parseReportFilters(request.nextUrl.searchParams),
      { actor: session.user, requestIp: getRequestIp(request) },
    );
    return new NextResponse(result.content, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
