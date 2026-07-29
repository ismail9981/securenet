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

Sprint 5 implements or preserves:

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
- `topology`: connection contracts, authorized snapshot port/service, Prisma
  adapter, deterministic React Flow layout, and accessible presentation;
- `realtime`: versioned message contracts, publisher port, bounded process-local
  adapter, authenticated SSE route, PostgreSQL worker bridge, and client
  recovery/polling state;
- `simulation`: typed scenarios, deterministic generation, run/application
  boundaries, PostgreSQL worker ownership, APIs, and Administrator presentation;
  and
- `shared`: common network enums and schemas.

Inventory domain/application code does not import Prisma. API routes and
server-rendered pages obtain the infrastructure-wired application service, while
the application service repeats authoritative permission checks close to every
device use case. Alert lifecycle updates, their Event, and their AuditLog record
share one database transaction. The metric-batch evaluator remains synchronous
and is invoked by the separate Sprint 5 Demo worker only after an accepted batch
commits.

Publications are post-commit cache-invalidation signals and cannot
change committed operation outcomes. REST remains authoritative. Topology never
derives links from `parentDeviceId`, and no connection CRUD or persisted layout
boundary exists.
