import { Inbox } from "lucide-react";

interface EmptyStateProps {
  description: string;
  title: string;
}

export function EmptyState({ description, title }: EmptyStateProps) {
  return (
    <section
      aria-labelledby="empty-state-title"
      className="bg-panel rounded-xl border border-dashed p-6 text-center"
    >
      <Inbox aria-hidden="true" className="text-muted mx-auto mb-3 size-6" />
      <h2 id="empty-state-title" className="font-semibold">
        {title}
      </h2>
      <p className="text-muted mx-auto mt-2 max-w-md text-sm leading-6">
        {description}
      </p>
    </section>
  );
}
