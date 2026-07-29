import type { NextRequest } from "next/server";

import {
  apiSuccess,
  authenticationRequired,
  getApiSession,
  handleApiError,
} from "@/lib/api";
import { alertRuleAdminService } from "@/modules/alerting/infrastructure/alert-rule-admin-service";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    return apiSuccess(
      await alertRuleAdminService.list({ actor: session.user }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
