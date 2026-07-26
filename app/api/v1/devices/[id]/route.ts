import type { NextRequest } from "next/server";
import { z } from "zod";

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
  deviceIdSchema,
  updateDeviceSchema,
} from "@/modules/inventory/domain/device";
import { deviceService } from "@/modules/inventory/infrastructure/device-service";

interface DeviceRouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(request: NextRequest, context: DeviceRouteContext) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();

  try {
    const id = deviceIdSchema.parse((await context.params).id);
    return apiSuccess(await deviceService.getById(id, { actor: session.user }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: DeviceRouteContext) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();

  try {
    authorizeActor({ actor: session.user }, "MANAGE_DEVICES");
    assertSameOrigin(request);
    const id = deviceIdSchema.parse((await context.params).id);
    const input = updateDeviceSchema.parse(await readJsonBody(request));
    return apiSuccess(
      await deviceService.update(id, input, {
        actor: session.user,
        requestIp: getRequestIp(request),
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: DeviceRouteContext,
) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();

  try {
    authorizeActor({ actor: session.user }, "MANAGE_DEVICES");
    assertSameOrigin(request);
    const id = deviceIdSchema.parse((await context.params).id);
    const body = z
      .object({ confirmed: z.literal(true) })
      .parse(await readJsonBody(request));
    return apiSuccess(
      await deviceService.archive(id, body.confirmed, {
        actor: session.user,
        requestIp: getRequestIp(request),
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
