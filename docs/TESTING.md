# Testing and database safety

Run static, unit/integration/component, build, and browser gates:

```bash
npm run format:check
npm run lint
npm run type-check
npm run prisma:validate
npm run prisma:generate
npm run db:migrate:deploy
npm test
npm run build
npm run test:e2e
npm audit
```

Database tests load `TEST_DATABASE_URL` and replace `DATABASE_URL` only after
positive validation that the database name is exactly `securenet_test`.
`npm run db:test:reset` refuses development and unknown database targets. Never
print connection URLs in evidence.

Sprint 3 coverage includes pure rule boundaries, duration and consecutive
conditions, exclusions, lifecycle/RBAC, actor/timestamp/note persistence,
transaction rollback, active deduplication under concurrency, Alert pagination
and filtering, Event cursor/filter/search, malformed inputs, related-device
history, archive preservation, idempotent seed/migration checks, desktop and
320-pixel mobile flows, and axe WCAG A/AA checks. Browser tests run serially
against a freshly reset `securenet_test`.

Sprint 6 coverage adds report aggregates and filters, bounded CSV output and
formula neutralization, global settings, bounded AlertRule administration,
historical Metric ranges/aggregation, saved topology positions, server RBAC and
role-aware UX, additive migration preservation, and performance budgets. The
desktop and 320-pixel browser matrix includes keyboard operation, reduced motion,
axe WCAG A/AA scans, reload persistence, empty/error/unauthorized behavior, and
regression coverage.

Performance evidence is produced by
`tests/integration/sprint-six-performance.test.ts`: initial report generation,
20 filter samples with P95 calculation, a 10,000-row CSV export, 30-day Metric
history, and a 30-node position save. These are local test-database budgets, not
production capacity claims.

Sprint 5 adds deterministic PRNG/replay, baseline ranges, bounded walk, scenario
effects/durations, five-second runtime and 60-second persistence boundaries,
Metric source/run traceability, lifecycle/cancellation/failure/restart recovery,
target overlap, idempotent batches, PostgreSQL worker locks, Alert
deduplication/no-auto-resolution, Event/Audit records, role-filtered
`simulation.status`, database-backed Dashboard data, API/RBAC/CSRF/rate-limit
tests, and Administrator control flows on desktop and 320 px. The browser server
starts the production web process and independent Demo worker against only
`securenet_test`.

Sprint 4 coverage adds connection validation and database constraints, canonical
undirected duplicates, cycles, disconnected and orphan nodes, archived
exclusion/history preservation, deterministic seed idempotence, authorized
Topology DTOs, React Flow and accessible-list parity, keyboard/mobile/reduced
motion/axe behavior, SSE authentication and same-origin enforcement, connection
and message limits, malformed/duplicate suppression, reconnect snapshot recovery,
polling fallback, after-commit publication, non-rollback publication failures,
and live Topology/Alert/Event refresh. Browser tests continue to run serially
against a freshly reset `securenet_test`.
