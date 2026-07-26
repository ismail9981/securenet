# ADR-0004: Alert lifecycle and Event Log contracts

- Status: Accepted for Sprint 3
- Date: 2026-07-26
- Sources: approved Sprint 3 plan and binding decisions; DOC-001, DOC-002,
  DOC-003, DOC-004, DOC-005, DOC-006, DOC-007, DOC-009, DOC-012, DOC-014

## Context

Sprint 3 replaces the Alert and Event placeholders with PostgreSQL-backed,
server-authorized operational workflows. The baseline conflicts on Alert states,
does not fully encode consecutive-sample rules, and schedules simulation and
realtime after Alerting. Sprint 3 therefore needs a canonical lifecycle, an
internal evaluation boundary, deterministic fixtures, and explicit boundaries
that do not pull later-sprint transports or generators forward.

## Decisions

### Alert lifecycle and authorization

Persist `OPEN`, `ACKNOWLEDGED`, `INVESTIGATING`, and `RESOLVED`. Every state except
`RESOLVED` is active.

- Administrator and Network Engineer may acknowledge `OPEN`.
- Administrator and Network Engineer may move `ACKNOWLEDGED` to
  `INVESTIGATING`.
- Administrator may resolve `OPEN`, `ACKNOWLEDGED`, or `INVESTIGATING`.
- Network Engineer may resolve `ACKNOWLEDGED` or `INVESTIGATING`.
- Administrator direct resolution from `OPEN` requires a non-empty override
  reason.
- Viewer has no lifecycle mutation permission.

Lifecycle updates append an Event and AuditLog record in the same transaction.

### Evaluation and rule representation

Implement a synchronous internal metric-batch evaluation service. It is an
application integration boundary for a future accepted metric batch, not a
scheduler, worker, simulation engine, polling loop, WebSocket, SSE, or realtime
transport.

AlertRule uses `durationSeconds` for duration conditions and nullable positive
`consecutiveSamples` for consecutive-reading or consecutive-failure conditions.
The bandwidth-utilization rule is seeded disabled and is not evaluated until link
capacity exists.

### Canonical Alert data and deduplication

Alert stores an explicit `source` enum (`METRIC_RULE` or `DEVICE_STATUS`),
nullable `acknowledgementNote`, and nullable `assigneeUserId`.

At most one active Alert may exist for a device/rule pair. Retriggering updates
the active Alert. A recurrence after resolution creates a new Alert; reopening a
resolved Alert is not implemented.

### Event Log

Use the fixed Event type vocabulary:

- `ALERT_OPENED`
- `ALERT_RETRIGGERED`
- `ALERT_ACKNOWLEDGED`
- `ALERT_INVESTIGATION_STARTED`
- `ALERT_RESOLVED`
- `DEVICE_CREATED`
- `DEVICE_UPDATED`
- `DEVICE_ARCHIVED`
- `DEVICE_STATUS_CHANGED`

Events are append-only and retained permanently in the Demo. New Events are
emitted prospectively. Existing Sprint 2 AuditLog rows are not backfilled or
rewritten.

### Query and history contracts

Alert lists use page pagination, `openedAt DESC`, default page size 20, and maximum 100. Supported filters are severity, status, device, and inclusive time bounds.

Event lists use cursor pagination, `createdAt DESC`, default limit 50, and maximum 100. Supported filters are device, Alert, actor, type, severity, time bounds, and
search.

Archived device relationships are preserved. Alert/Event presentation retains the
device identity, labels it Archived, hides mutation controls, and avoids links to
an ordinary Device route that returns 404.

## Security and persistence

Authentication remains the Sprint 1 server-only Demo adapter. PostgreSQL User rows
remain reference principals for foreign-key integrity only. Every endpoint
verifies the session; application services enforce permissions close to use cases.
Bodies and query parameters are bounded and validated.

Schema changes are additive and migration-based. Alert/Event history uses
restrictive foreign keys and no hard-delete API. Test reset remains limited to a
positively identified `securenet_test` database.

## Consequences

- Device Details can display related persisted Alerts and Events.
- `activeAlertCount` can represent persisted active Alerts while remaining
  unavailable if the data source fails.
- The Sprint 1 Dashboard stays on its deterministic fixture repository.
- Bandwidth threshold evaluation remains unverified.
- Simulation, scheduling, realtime, topology, AlertRule management UI, reports,
  notifications, production identity, and user-management UI remain outside
  Sprint 3.
