import type { ReactNode } from "react";

interface OperationalPageHeaderProps {
  readonly index: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: ReactNode;
  readonly metadata?: readonly {
    readonly label: string;
    readonly value: ReactNode;
    readonly tone?: "neutral" | "live" | "warning" | "critical";
  }[];
  readonly action?: ReactNode;
}

export function OperationalPageHeader({
  action,
  description,
  eyebrow,
  index,
  metadata = [],
  title,
}: OperationalPageHeaderProps) {
  return (
    <header className="operational-header">
      <div className="operational-header__lead">
        <p className="section-kicker">
          <span aria-hidden="true">{index}</span>
          <span className="section-kicker__rule" />
          {eyebrow}
        </p>
        <h1>{title}</h1>
        <p className="operational-header__description">{description}</p>
      </div>
      {action || metadata.length ? (
        <div className="operational-header__aside">
          {action}
          {metadata.length ? (
            <dl className="operational-metadata">
              {metadata.map(({ label, tone = "neutral", value }) => (
                <div data-tone={tone} key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

export function OperationalSectionHeader({
  action,
  description,
  index,
  title,
}: {
  readonly action?: ReactNode;
  readonly description?: ReactNode;
  readonly index: string;
  readonly title: string;
}) {
  return (
    <div className="operational-section-header">
      <div>
        <p className="section-kicker">{index} / SYSTEM MODULE</p>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
