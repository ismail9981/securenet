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
import { updateSystemSettingSchema } from "@/modules/settings/domain/settings";
import { settingsService } from "@/modules/settings/infrastructure/settings-service";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    return apiSuccess(await settingsService.get({ actor: session.user }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();
  try {
    assertSameOrigin(request, "MANAGE_SETTINGS");
    const input = updateSystemSettingSchema.parse(await readJsonBody(request));
    return apiSuccess(
      await settingsService.update(input, {
        actor: session.user,
        requestIp: getRequestIp(request),
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
