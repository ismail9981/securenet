export function ReportFilters({
  values,
}: {
  readonly values: Readonly<Record<string, string>>;
}) {
  return (
    <form className="bg-panel grid gap-3 rounded-xl border p-4 md:grid-cols-3">
      <label className="text-sm">
        <span className="text-muted mb-1 block">From</span>
        <input
          className="bg-panel-raised min-h-11 w-full rounded-lg border px-3"
          defaultValue={values.from}
          name="from"
          type="datetime-local"
        />
      </label>
      <label className="text-sm">
        <span className="text-muted mb-1 block">To</span>
        <input
          className="bg-panel-raised min-h-11 w-full rounded-lg border px-3"
          defaultValue={values.to}
          name="to"
          type="datetime-local"
        />
      </label>
      <label className="text-sm">
        <span className="text-muted mb-1 block">Severity</span>
        <select
          className="bg-panel-raised min-h-11 w-full rounded-lg border px-3"
          defaultValue={values.severity}
          name="severity"
        >
          <option value="">All severities</option>
          <option>INFO</option>
          <option>WARNING</option>
          <option>CRITICAL</option>
        </select>
      </label>
      <label className="text-sm">
        <span className="text-muted mb-1 block">Alert status</span>
        <select
          className="bg-panel-raised min-h-11 w-full rounded-lg border px-3"
          defaultValue={values.alertStatus}
          name="alertStatus"
        >
          <option value="">All Alert statuses</option>
          <option>OPEN</option>
          <option>ACKNOWLEDGED</option>
          <option>INVESTIGATING</option>
          <option>RESOLVED</option>
        </select>
      </label>
      <label className="text-sm">
        <span className="text-muted mb-1 block">Device status</span>
        <select
          className="bg-panel-raised min-h-11 w-full rounded-lg border px-3"
          defaultValue={values.deviceStatus}
          name="deviceStatus"
        >
          <option value="">All Device statuses</option>
          <option>ONLINE</option>
          <option>DEGRADED</option>
          <option>OFFLINE</option>
          <option>MAINTENANCE</option>
          <option>UNKNOWN</option>
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button
          className="bg-brand min-h-11 rounded-lg px-4 font-semibold text-slate-950"
          type="submit"
        >
          Apply filters
        </button>
        <a
          className="bg-panel-raised inline-flex min-h-11 items-center rounded-lg border px-4 text-sm"
          href="/reports"
        >
          Clear
        </a>
      </div>
    </form>
  );
}
