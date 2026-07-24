export function LoadingState() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading SecureNet view"
      className="min-h-screen p-4 md:p-6"
    >
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="bg-panel-raised mb-6 h-4 w-32 rounded" />
        <div className="bg-panel-raised mb-3 h-9 w-64 rounded" />
        <div className="bg-panel-raised mb-8 h-4 max-w-xl rounded" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="bg-panel h-28 rounded-xl border" key={index} />
          ))}
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </main>
  );
}
