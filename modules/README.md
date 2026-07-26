# Logical module boundary

SecureNet is a modular monolith. Product modules will live below this directory as
`identity`, `inventory`, `telemetry`, `monitoring`, `alerting`, `event-log`,
`topology`, `simulation`, and `reporting`.

Each implemented module follows the approved dependency direction:

1. `domain/` — entities, value objects, and pure rules.
2. `application/` — use cases, DTOs, and ports.
3. `infrastructure/` — repositories and external adapters.
4. `presentation/` — route-facing components, hooks, and handlers.
5. `tests/` — module integration fixtures where colocated tests are insufficient.

Sprint 3 implements:

- `identity`: the unchanged Sprint 1 Demo identity/session adapter and RBAC rules;
- `inventory`: device schemas, repository port, authorized application service,
  Prisma adapter, responsive presentation components, persisted active Alert
  counts, and prospective device Events;
- `alerting`: pure threshold/duration/consecutive rules, lifecycle state machine,
  application port/service, transactional Prisma adapter, and responsive UI;
- `event-log`: fixed Event vocabulary, cursor/query contracts, read-only
  application boundary, Prisma adapter, and timeline UI;
- `telemetry`: the pure configurable metric-freshness rule;
- `monitoring`: the intentionally partial Sprint 1 Health Score rules; and
- `shared`: common network enums and schemas.

Inventory domain/application code does not import Prisma. API routes and
server-rendered pages obtain the infrastructure-wired application service, while
the application service repeats authoritative permission checks close to every
device use case. Alert lifecycle updates, their Event, and their AuditLog record
share one database transaction. The metric-batch evaluator is synchronous and
has no scheduler or realtime transport.
