import type { NextRequest } from "next/server";

import {
  apiSuccess,
  authenticationRequired,
  getApiSession,
  handleApiError,
} from "@/lib/api";
import { alertIdSchema } from "@/modules/alerting/domain/alert";
import { alertService } from "@/modules/alerting/infrastructure/alert-service";

interface Context {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    const id = alertIdSchema.parse((await context.params).id);
    return apiSuccess(await alertService.getById(id, { actor: session.user }));
  } catch (error) {
    return handleApiError(error);
  }
}
