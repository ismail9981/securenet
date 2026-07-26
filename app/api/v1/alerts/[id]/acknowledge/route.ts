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
import { authorizeActor } from "@/modules/identity/application/authorize";
import {
  acknowledgeAlertSchema,
  alertIdSchema,
} from "@/modules/alerting/domain/alert";
import { alertService } from "@/modules/alerting/infrastructure/alert-service";

interface Context {
  readonly params: Promise<{ readonly id: string }>;
}

export async function POST(request: NextRequest, context: Context) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    authorizeActor({ actor: session.user }, "ACKNOWLEDGE_ALERTS");
    assertSameOrigin(request, "ACKNOWLEDGE_ALERTS");
    const id = alertIdSchema.parse((await context.params).id);
    const input = acknowledgeAlertSchema.parse(await readJsonBody(request));
    return apiSuccess(
      await alertService.acknowledge(id, input, {
        actor: session.user,
        requestIp: getRequestIp(request),
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
