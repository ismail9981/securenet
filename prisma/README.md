# Database boundary

Sprint 2 implements DOC-005's PostgreSQL boundary with Prisma. The schema contains
Demo audit users, locations, devices, a nullable self-referencing parent device,
append-only metric history, and append-only device-operation audit records.

- UUIDs are stable public identifiers; metric IDs are monotonic cursors.
- Database names are snake_case and timestamps are UTC.
- Active hostname and IP uniqueness is enforced by partial PostgreSQL indexes.
- `DELETE` archives a device and preserves metrics and audit records.
- MAC addresses use normalized `VARCHAR(17)` plus a database check because Prisma's
  PostgreSQL connector does not expose `macaddr` as a usable generated-client type.
- No Alert or Event Log model is introduced in Sprint 2.

`prisma/seed.ts` is deterministic and idempotent. It creates three audit-reference
users, three locations, 30 active devices, and 720 metric rows covering 24 hours.
Authentication continues to use the Sprint 1 server-only repository.

Migrations are additive and deployed with `npm run db:migrate:deploy`. Production
rollback is backup restore or a reviewed forward-fix migration; destructive schema
reset is not an application rollback strategy. Automated reset is limited to
`securenet_test` by `scripts/reset-test-database.ts`.
