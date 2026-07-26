import { Siren } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { alertService } from "@/modules/alerting/infrastructure/alert-service";
import { AlertList } from "@/modules/alerting/presentation/AlertList";
import { parseAlertListQuery } from "@/modules/alerting/presentation/alert-query";
import { requireServerSession } from "@/modules/identity/infrastructure/server-session";

export const metadata: Metadata = { title: "Alerts" };

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

function pageHref(
  query: ReturnType<typeof parseAlertListQuery>,
  page: number,
): Route {
  const result = new URLSearchParams({
    page: String(page),
    pageSize: String(query.pageSize),
  });
  query.severities.forEach((value) => result.append("severity", value));
  query.statuses.forEach((value) => result.append("status", value));
  if (query.deviceId) result.set("deviceId", query.deviceId);
  if (query.from) result.set("from", query.from.toISOString());
  if (query.to) result.set("to", query.to.toISOString());
  return `/alerts?${result.toString()}` as Route;
}

export default async function AlertsPage({ searchParams }: Props) {
  const session = await requireServerSession();
  const search = params(await searchParams);
  const query = parseAlertListQuery(search);
  const page = await alertService.list(query, { actor: session.user });
  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-6">
        <div className="border-brand/25 bg-brand/10 text-brand mb-4 flex size-11 items-center justify-center rounded-xl border">
          <Siren aria-hidden="true" className="size-5" />
        </div>
        <p className="text-brand text-xs font-semibold tracking-[0.16em] uppercase">
          Incident response · Persisted Demo data
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Alerts
        </h1>
        <p className="text-muted mt-2 text-sm">
          Synchronous rule-evaluation results with audited lifecycle controls.
          Connected updates refresh this persisted Alert snapshot.
        </p>
      </header>

      <section
        aria-label="Severity summary"
        className="mb-6 grid grid-cols-3 gap-3"
      >
        {(["CRITICAL", "WARNING", "INFO"] as const).map((severity) => (
          <div className="bg-panel rounded-xl border p-4" key={severity}>
            <p className="text-muted text-xs">{severity}</p>
            <p className="mt-1 text-2xl font-semibold">
              {page.meta.severitySummary[severity]}
            </p>
          </div>
        ))}
      </section>

      <form className="bg-panel mb-6 grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4">
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
          Status
          <select
            className="bg-panel-raised text-foreground mt-1 min-h-11 w-full rounded-lg border px-3"
            defaultValue={query.statuses[0] ?? ""}
            name="status"
          >
            <option value="">All</option>
            <option>OPEN</option>
            <option>ACKNOWLEDGED</option>
            <option>INVESTIGATING</option>
            <option>RESOLVED</option>
          </select>
        </label>
        <button className="bg-brand mt-auto min-h-11 rounded-lg px-4 font-semibold text-slate-950">
          Apply filters
        </button>
        <Link
          className="bg-panel-raised mt-auto grid min-h-11 place-items-center rounded-lg border px-4 font-semibold"
          href="/alerts"
        >
          Clear
        </Link>
      </form>

      <AlertList
        key={search.toString()}
        page={page}
        refreshUrl={`/api/v1/alerts?${search.toString()}`}
        role={session.user.role}
      />
      <nav
        aria-label="Alert pagination"
        className="mt-6 flex items-center justify-between"
      >
        <span className="text-muted text-sm">
          Page {page.meta.page} of {page.meta.totalPages} · {page.meta.total}{" "}
          alerts
        </span>
        <div className="flex gap-2">
          {query.page > 1 ? (
            <Link
              className="bg-panel min-h-11 rounded-lg border px-4 py-3 text-sm"
              href={pageHref(query, query.page - 1)}
            >
              Previous
            </Link>
          ) : null}
          {query.page < page.meta.totalPages ? (
            <Link
              className="bg-panel min-h-11 rounded-lg border px-4 py-3 text-sm"
              href={pageHref(query, query.page + 1)}
            >
              Next
            </Link>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
