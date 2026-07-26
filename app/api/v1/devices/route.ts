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
import { createDeviceSchema } from "@/modules/inventory/domain/device";
import { deviceService } from "@/modules/inventory/infrastructure/device-service";
import { parseDeviceListQuery } from "@/modules/inventory/presentation/device-query";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();

  try {
    const query = parseDeviceListQuery(request.nextUrl.searchParams);
    const result = await deviceService.list(query, { actor: session.user });
    return apiSuccess(result.data, { meta: result.meta });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();

  try {
    authorizeActor({ actor: session.user }, "MANAGE_DEVICES");
    assertSameOrigin(request);
    const input = createDeviceSchema.parse(await readJsonBody(request));
    const device = await deviceService.create(input, {
      actor: session.user,
      requestIp: getRequestIp(request),
    });
    return apiSuccess(device, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
