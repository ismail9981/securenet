import type { NextRequest } from "next/server";

import {
  apiError,
  assertSameOrigin,
  authenticationRequired,
  getApiSession,
  handleApiError,
} from "@/lib/api";
import {
  CONNECTION_IDLE_TIMEOUT_MS,
  HEARTBEAT_INTERVAL_MS,
  RECONNECT_DELAY_MS,
  type RealtimeEnvelope,
} from "@/modules/realtime/application/realtime-contracts";
import { realtimeHub } from "@/modules/realtime/infrastructure/in-process-realtime-publisher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function encodeEvent(envelope: RealtimeEnvelope): Uint8Array {
  return new TextEncoder().encode(
    `id: ${envelope.eventId}\nevent: ${envelope.eventType}\ndata: ${JSON.stringify(envelope)}\n\n`,
  );
}

function assertRealtimeOrigin(request: NextRequest): void {
  assertSameOrigin(request, "VIEW_DEVICES");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new Error("REALTIME_ORIGIN_REJECTED");
  }
}

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return authenticationRequired();

  try {
    assertRealtimeOrigin(request);
    if (!realtimeHub.canConnect(session.user.id)) {
      return apiError(
        429,
        "REALTIME_CONNECTION_LIMIT",
        "The Demo realtime connection limit has been reached.",
      );
    }

    let release: (() => void) | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let idleTimeout: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const cleanup = () => {
      if (closed) return;
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      if (idleTimeout) clearTimeout(idleTimeout);
      release?.();
      release = null;
    };

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const enqueue = (value: Uint8Array) => {
          if (closed) return;
          try {
            controller.enqueue(value);
          } catch {
            cleanup();
          }
        };

        release = realtimeHub.subscribe(session.user.id, (envelope) => {
          enqueue(encodeEvent(envelope));
        });
        if (!release) {
          controller.error(new Error("Realtime connection limit reached."));
          cleanup();
          return;
        }

        enqueue(
          new TextEncoder().encode(
            `retry: ${RECONNECT_DELAY_MS}\n: connected\n\n`,
          ),
        );
        heartbeat = setInterval(() => {
          enqueue(new TextEncoder().encode(`: heartbeat ${Date.now()}\n\n`));
        }, HEARTBEAT_INTERVAL_MS);
        idleTimeout = setTimeout(() => {
          cleanup();
          try {
            controller.close();
          } catch {
            // The browser may already have closed the stream.
          }
        }, CONNECTION_IDLE_TIMEOUT_MS);
        request.signal.addEventListener("abort", cleanup, { once: true });
      },
      cancel() {
        cleanup();
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "REALTIME_ORIGIN_REJECTED"
    ) {
      return apiError(
        403,
        "AUTH_FORBIDDEN",
        "You do not have permission to perform this action.",
      );
    }
    return handleApiError(error);
  }
}
