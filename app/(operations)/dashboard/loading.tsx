export default function DashboardLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Dashboard"
      className="mx-auto max-w-7xl"
    >
      <div className="bg-panel-raised mb-6 h-8 w-48 animate-pulse rounded" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            className="bg-panel h-32 animate-pulse rounded-xl border"
            key={index}
          />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="bg-panel h-72 animate-pulse rounded-xl border" />
        <div className="bg-panel h-72 animate-pulse rounded-xl border" />
      </div>
      <span className="sr-only">Loading Dashboard…</span>
    </div>
  );
}
