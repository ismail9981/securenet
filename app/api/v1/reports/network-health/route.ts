import type { NextRequest } from "next/server";

import {
  apiSuccess,
  authenticationRequired,
  getApiSession,
  handleApiError,
} from "@/lib/api";
import { parseReportFilters } from "@/modules/reporting/domain/report-filters";
import { reportService } from "@/modules/reporting/infrastructure/report-service";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    const filters = parseReportFilters(request.nextUrl.searchParams);
    return apiSuccess(
      await reportService.networkHealth(filters, { actor: session.user }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
