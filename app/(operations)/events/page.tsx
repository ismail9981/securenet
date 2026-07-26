import { ListTree } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { requireServerSession } from "@/modules/identity/infrastructure/server-session";
import { eventService } from "@/modules/event-log/infrastructure/event-service";
import { EventTimeline } from "@/modules/event-log/presentation/EventTimeline";
import { parseEventListQuery } from "@/modules/event-log/presentation/event-query";

export const metadata: Metadata = { title: "Events" };

interface Props {
  readonly searchParams: Promise<
    Record<string, string | readonly string[] | undefined>
  >;
}

function params(
  values: Record<string, string | readonly string[] | undefined>,
) {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string") result.set(key, value);
    else value?.forEach((item) => result.append(key, item));
  }
  return result;
}

function cursorHref(
  query: ReturnType<typeof parseEventListQuery>,
  cursor: string,
): Route {
  const result = new URLSearchParams({ cursor, limit: String(query.limit) });
  if (query.deviceId) result.set("deviceId", query.deviceId);
  if (query.alertId) result.set("alertId", query.alertId);
  if (query.actorUserId) result.set("actorUserId", query.actorUserId);
  query.types.forEach((value) => result.append("type", value));
  query.severities.forEach((value) => result.append("severity", value));
  if (query.from) result.set("from", query.from.toISOString());
  if (query.to) result.set("to", query.to.toISOString());
  if (query.search) result.set("search", query.search);
  return `/events?${result.toString()}` as Route;
}

export default async function EventsPage({ searchParams }: Props) {
  const session = await requireServerSession();
  const search = params(await searchParams);
  const query = parseEventListQuery(search);
  const page = await eventService.list(query, { actor: session.user });
  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-6">
        <div className="border-brand/25 bg-brand/10 text-brand mb-4 flex size-11 items-center justify-center rounded-xl border">
          <ListTree aria-hidden="true" className="size-5" />
        </div>
        <p className="text-brand text-xs font-semibold tracking-[0.16em] uppercase">
          Operational history · Permanent Demo retention
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Events
        </h1>
        <p className="text-muted mt-2 text-sm">
          Immutable Alert and device activity. Existing Sprint 2 AuditLog rows
          were not fabricated into Events.
        </p>
      </header>
      <form className="bg-panel mb-6 grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-muted text-xs sm:col-span-2">
          Search event messages
          <input
            className="bg-panel-raised text-foreground mt-1 min-h-11 w-full rounded-lg border px-3"
            defaultValue={query.search}
            maxLength={200}
            name="search"
            type="search"
          />
        </label>
        <label className="text-muted text-xs">
          Event type
          <select
            className="bg-panel-raised text-foreground mt-1 min-h-11 w-full rounded-lg border px-3"
            defaultValue={query.types[0] ?? ""}
            name="type"
          >
            <option value="">All</option>
            <option>ALERT_OPENED</option>
            <option>ALERT_RETRIGGERED</option>
            <option>ALERT_ACKNOWLEDGED</option>
            <option>ALERT_INVESTIGATION_STARTED</option>
            <option>ALERT_RESOLVED</option>
            <option>DEVICE_CREATED</option>
            <option>DEVICE_UPDATED</option>
            <option>DEVICE_ARCHIVED</option>
            <option>DEVICE_STATUS_CHANGED</option>
          </select>
        </label>
        <label className="text-muted text-xs">
          Device ID
          <input
            className="bg-panel-raised text-foreground mt-1 min-h-11 w-full rounded-lg border px-3"
            defaultValue={query.deviceId ?? ""}
            name="deviceId"
            placeholder="UUID"
          />
        </label>
        <label className="text-muted text-xs">
          Alert ID
          <input
            className="bg-panel-raised text-foreground mt-1 min-h-11 w-full rounded-lg border px-3"
            defaultValue={query.alertId ?? ""}
            name="alertId"
            placeholder="UUID"
          />
        </label>
        <label className="text-muted text-xs">
          Actor user ID
          <input
            className="bg-panel-raised text-foreground mt-1 min-h-11 w-full rounded-lg border px-3"
            defaultValue={query.actorUserId ?? ""}
            name="actorUserId"
            placeholder="UUID"
          />
        </label>
        <label className="text-muted text-xs">
          From (ISO 8601)
          <input
            className="bg-panel-raised text-foreground mt-1 min-h-11 w-full rounded-lg border px-3"
            defaultValue={query.from?.toISOString() ?? ""}
            name="from"
            placeholder="2026-07-26T00:00:00Z"
          />
        </label>
        <label className="text-muted text-xs">
          To (ISO 8601)
          <input
            className="bg-panel-raised text-foreground mt-1 min-h-11 w-full rounded-lg border px-3"
            defaultValue={query.to?.toISOString() ?? ""}
            name="to"
            placeholder="2026-07-27T00:00:00Z"
          />
        </label>
        <label className="text-muted text-xs">
          Severity
          <select
            className="bg-panel-raised text-foreground mt-1 min-h-11 w-full rounded-lg border px-3"
            defaultValue={query.severities[0] ?? ""}
            name="severity"
          >
            <option value="">All</option>
            <option>CRITICAL</option>
            <option>WARNING</option>
            <option>INFO</option>
          </select>
        </label>
        <button className="bg-brand mt-auto min-h-11 rounded-lg px-4 font-semibold text-slate-950">
          Apply filters
        </button>
        <Link
          className="bg-panel-raised mt-auto grid min-h-11 place-items-center rounded-lg border px-4 font-semibold"
          href="/events"
        >
          Clear
        </Link>
      </form>
      <EventTimeline
        key={search.toString()}
        page={page}
        refreshUrl={`/api/v1/events?${search.toString()}`}
      />
      <div className="mt-6 flex justify-end">
        {page.meta.nextCursor ? (
          <Link
            className="bg-panel min-h-11 rounded-lg border px-4 py-3 text-sm"
            href={cursorHref(query, page.meta.nextCursor)}
          >
            Older events
          </Link>
        ) : (
          <span className="text-muted text-sm">End of Event history</span>
        )}
      </div>
    </div>
  );
}
