# Database boundary

Sprint 3 extends DOC-005's PostgreSQL boundary with Prisma. The schema contains
Demo audit users, locations, devices, a nullable self-referencing parent device,
append-only metric history, Alert rules, Alerts, immutable Events, and append-only
audit records.

- UUIDs are stable public identifiers; metric IDs are monotonic cursors.
- Database names are snake_case and timestamps are UTC.
- Active hostname and IP uniqueness is enforced by partial PostgreSQL indexes.
- `DELETE` archives a device and preserves metrics and audit records.
- A partial unique index permits at most one non-resolved Alert per device/rule.
- Alert/Event foreign keys use `RESTRICT`; archived-device history is preserved.
- Events use monotonic IDs for stable `(createdAt, id)` cursor pagination and have
  no update or delete application boundary.
- MAC addresses use normalized `VARCHAR(17)` plus a database check because Prisma's
  PostgreSQL connector does not expose `macaddr` as a usable generated-client type.

`prisma/seed.ts` is deterministic and idempotent. It creates three audit-reference
users, three locations, 30 active devices, 720 metric rows covering 24 hours,
seven rules (bandwidth disabled), four Alerts, and five fixture Events.
Authentication continues to use the Sprint 1 server-only repository.

Migrations are additive and deployed with `npm run db:migrate:deploy`. Production
rollback is backup restore or a reviewed forward-fix migration; destructive schema
reset is not an application rollback strategy. Automated reset is limited to
`securenet_test` by `scripts/reset-test-database.ts`.
