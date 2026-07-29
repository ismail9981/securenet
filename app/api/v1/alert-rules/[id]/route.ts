import type { NextRequest } from "next/server";

import {
  apiSuccess,
  assertSameOrigin,
  authenticationRequired,
  getApiSession,
  getRequestIp,
  handleApiError,
  readJsonBody,
} from "@/lib/api";
import {
  alertRuleIdSchema,
  updateAlertRuleSchema,
} from "@/modules/alerting/domain/alert-rule-admin";
import { alertRuleAdminService } from "@/modules/alerting/infrastructure/alert-rule-admin-service";

export async function PATCH(
  request: NextRequest,
  context: { readonly params: Promise<{ readonly id: string }> },
) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    assertSameOrigin(request, "MANAGE_ALERT_RULES");
    const id = alertRuleIdSchema.parse((await context.params).id);
    const input = updateAlertRuleSchema.parse(await readJsonBody(request));
    return apiSuccess(
      await alertRuleAdminService.update(id, input, {
        actor: session.user,
        requestIp: getRequestIp(request),
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
