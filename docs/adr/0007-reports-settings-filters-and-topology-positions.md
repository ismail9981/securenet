# ADR-0007: Sprint 6 reports, settings, filters, and topology positions

- Status: Accepted
- Date: 2026-07-29

## Context

Sprint 6 implements the approved P1 reporting and settings scope while completing
the approved historical Metric presentation and saved Topology position work.
Sprint 0–5 architecture and retained operational history remain authoritative.

## Decision

- Implement one Network Health Report and a bounded Alerts CSV export.
- Use one PostgreSQL-backed global `SystemSetting` row for timezone and display
  units. Settings affect presentation only.
- Permit Administrators to update bounded fields on existing AlertRules. Rule
  identity, metric, operator, and scope remain immutable.
- Store shared filters only in validated URL query parameters.
- Present historical Device Metrics for the approved five ranges and aggregation
  intervals, with an accessible table.
- Persist partial Administrator-submitted Topology positions transactionally.
  Deterministic layout remains the fallback and `NetworkConnection` remains the
  only rendered-link source.
- Append only the approved AuditLog actions:
  `report.alerts.exported`, `settings.updated`, `alert_rule.updated`, and
  `topology.positions.saved`.
- Preserve Demo-only identity, signed sessions, server-side authorization, API
  envelopes, the four-state Alert lifecycle, all existing history, and both
  Dashboard repositories.

## Security and safety

Mutations require an authenticated Administrator, same-origin validation,
strict schemas, bounded payloads, transactions, and safe AuditLog metadata.
CSV output is bounded to 10,000 rows and neutralizes spreadsheet formulas.
Database test resets remain restricted to the positively identified test
database.

## Explicit deferrals

Sprint 6 does not implement printable/PDF reports, user management, Demo reset,
Alert recurrence/reopen, incident overlays, capacity editing, bandwidth
utilization, automatic Alert resolution, retention jobs, production deployment,
Sprint 7, or a v1.0 release. AR-BW-01 remains disabled. The Health Score remains
partial and disclosed.
