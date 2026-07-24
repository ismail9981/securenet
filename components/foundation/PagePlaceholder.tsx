import { CheckCircle2, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/foundation/EmptyState";

interface PagePlaceholderProps {
  context?: string;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  plannedItems: readonly string[];
  requirementIds: readonly string[];
  title: string;
}

export function PagePlaceholder({
  context,
  description,
  eyebrow,
  icon: Icon,
  plannedItems,
  requirementIds,
  title,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-6">
        <div className="border-brand/25 bg-brand/10 text-brand mb-4 flex size-11 items-center justify-center rounded-xl border">
          <Icon aria-hidden="true" className="size-5" />
        </div>
        <p className="text-brand text-xs font-semibold tracking-[0.16em] uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="text-muted mt-3 max-w-3xl text-sm leading-6 sm:text-base">
          {description}
        </p>
        {context ? (
          <p className="mt-3 font-mono text-xs break-all text-[var(--text-subtle)]">
            {context}
          </p>
        ) : null}
      </header>

      <section
        aria-labelledby="foundation-status"
        className="bg-panel mb-6 rounded-xl border p-4 sm:p-5"
      >
        <div className="flex gap-3">
          <CheckCircle2
            aria-hidden="true"
            className="text-success mt-0.5 size-5 shrink-0"
          />
          <div>
            <h2 id="foundation-status" className="font-semibold">
              Sprint 0 foundation placeholder
            </h2>
            <p className="text-muted mt-1 text-sm leading-6">
              Routing, layout, design tokens, and shared states are active. The
              items below describe approved future work; they are not presented
              as implemented.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <EmptyState
          description="This route is intentionally data-free until its documented implementation sprint. Empty, loading, error, and not-found foundations are already available."
          title={`No ${title.toLowerCase()} data in Sprint 0`}
        />

        <aside
          className="bg-panel rounded-xl border p-5"
          aria-labelledby="planned-scope"
        >
          <h2 id="planned-scope" className="text-sm font-semibold">
            Approved planned scope
          </h2>
          <ul className="text-muted mt-4 space-y-3 text-sm">
            {plannedItems.map((item) => (
              <li className="flex gap-2.5" key={item}>
                <span
                  aria-hidden="true"
                  className="bg-brand mt-2 size-1.5 shrink-0 rounded-full"
                />
                <span className="leading-5">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t pt-4 text-xs leading-5 text-[var(--text-subtle)]">
            Requirements: {requirementIds.join(", ")}
          </p>
        </aside>
      </div>
    </div>
  );
}
