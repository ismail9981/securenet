import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section
        aria-labelledby="not-found-title"
        className="bg-panel w-full max-w-lg rounded-xl border p-6 text-center"
      >
        <FileQuestion
          aria-hidden="true"
          className="text-info mx-auto mb-4 size-8"
        />
        <p className="text-info mb-2 text-xs font-semibold tracking-[0.16em] uppercase">
          404 · Not found
        </p>
        <h1 id="not-found-title" className="text-xl font-semibold">
          This SecureNet view does not exist
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          The address may be incorrect, or the requested resource may no longer
          be available.
        </p>
        <Link
          className="bg-brand mt-6 inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-[var(--accent-primary-hover)]"
          href="/dashboard"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
