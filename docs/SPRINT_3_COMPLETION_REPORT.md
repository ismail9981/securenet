# Sprint 3 completion report

Date: 2026-07-26  
Baseline: commit `4f0975f`, tag `v0.2.0`  
Scope: Alerts and Events only

## Outcome

Sprint 3 implements the approved four-state Alert lifecycle, pure rule evaluation,
synchronous accepted-metric-batch boundary, database-enforced active
device/rule deduplication, permanent immutable Event history, related Device
history, and role-aware responsive UI. ADR-0004 records D-01 through D-13.

The Sprint 1 Demo identity/session/RBAC architecture and Dashboard fixture
repository are unchanged. Sprint 2 Device persistence, soft archive, metrics, and
AuditLog behavior remain intact; device mutations now prospectively append Events
in the same transaction. No Sprint 4 or later runtime was introduced.

## Persistence and seed evidence

Migration `20260726150000_sprint_3_alerts_and_events` is additive. It creates the
AlertRule, Alert, and Event tables; fixed enums; restrictive foreign keys; query
indexes; positive consecutive-sample and lifecycle checks; and the partial unique
active device/rule index. Prisma reported both `securenet_dev` and
`securenet_test` up to date with two migrations and no pending migration.

The idempotent seed produces 7 rules, 4 Alerts, and 5 fixture Events in addition
to the unchanged 3 audit users, 3 locations, 30 devices, and 720 metric rows.
`AR-BW-01` is disabled. Automated double-reset evidence returned identical
`[7, 4, 5]` Sprint 3 counts.

The destructive reset negative gate refused a development target with:
`TEST_DATABASE_URL must target securenet_test`. No connection URL or credential
was printed or committed.

## Requirements verified

- FR-008, FR-009, FR-010
- PRD-DD-004
- PRD-ALT-001, PRD-ALT-002, PRD-ALT-003, PRD-ALT-004
- PRD-EVT-001, PRD-EVT-002, PRD-EVT-003
- SRS-FR-006, SRS-FR-007, SRS-FR-009, SRS-FR-010, SRS-FR-012

System-wide NFRs remain In Progress even where Sprint 3 evidence passed.

## Validation evidence

| Gate                     | Result                                           |
| ------------------------ | ------------------------------------------------ |
| Clean install            | `npm ci`: 607 packages; passed                   |
| Dependency tree          | `npm ls --depth=0`: passed                       |
| Prisma validate/generate | passed; Prisma 7.8.0                             |
| Migration deploy/status  | dev and test current; 2/2 migrations             |
| Migration SQL review     | additive; no destructive prior-table operation   |
| Test reset guard         | refused `securenet_dev` target before connection |
| Prettier                 | passed                                           |
| ESLint                   | passed with 0 warnings                           |
| TypeScript               | passed                                           |
| Vitest                   | 22 files; 90 passed, 0 failed, 0 skipped         |
| Production build         | passed; all Sprint 3 routes in manifest          |
| Playwright               | 42 passed, 0 failed, 0 skipped                   |
| Desktop browser cases    | 21 passed                                        |
| 320 px mobile cases      | 21 passed                                        |
| axe checks               | passed with no serious/critical violations       |
| npm audit                | 0 vulnerabilities                                |

The initial full Vitest attempt had one host-load timeout in an existing bcrypt
login case; the isolated rerun passed 6/6 and the complete rerun passed 90/90.
The initial Playwright attempt exposed an ambiguous test selector only (40 passed,
2 failed); the affected Sprint 3 file then passed 6/6 and the required full rerun
passed 42/42. No product implementation was changed for either test-only issue.

## HTTP, RBAC, lifecycle, and security smoke evidence

- unauthenticated Alerts: 401
- Admin login: 200; Viewer login: 200
- Alert list, Event list, related-device Alerts: 200
- malformed Event cursor: 400 `VALIDATION_ERROR`
- missing Alert: 404 `ALERT_NOT_FOUND`
- Viewer acknowledgement: 403 `AUTH_FORBIDDEN`
- Admin direct OPEN resolution without reason: 400
  `ALERT_OVERRIDE_REASON_REQUIRED`
- Admin direct OPEN resolution with reason: 200 and `RESOLVED`
- protected Dashboard after Sprint 3: 200

Source and test review confirmed same-origin mutation enforcement, bounded Zod
queries/bodies, generic error envelopes, no database details in conflicts,
transaction rollback, actor/note/timestamp persistence, one active Alert under
concurrent evaluation, and archived Alert/Event identity retention without a
dead link or mutation controls.

## Deferred and partial work

- FR-007 remains In Progress because bandwidth-utilization evaluation is Deferred
  until link capacity exists; no bandwidth threshold is marked Verified.
- Automatic invocation, scheduler, worker, simulation, polling, WebSocket, SSE,
  and realtime UI remain Deferred to approved later sprints.
- AlertRule management UI, assignment-management UI, reopen, purge/retention jobs,
  topology, reports, notifications, production identity/deployment, and user
  management remain Deferred.
- FR-002, FR-005, FR-013, PRD-DD-003, PRD-DASH-002, and system-wide NFRs remain
  In Progress as previously documented.

Sprint 4 was not started. No push or tag was created.

## Exact file inventory

Created:

```text
app/(operations)/alerts/error.tsx
app/(operations)/alerts/loading.tsx
app/(operations)/events/error.tsx
app/(operations)/events/loading.tsx
app/api/v1/alerts/[id]/acknowledge/route.ts
app/api/v1/alerts/[id]/investigate/route.ts
app/api/v1/alerts/[id]/resolve/route.ts
app/api/v1/alerts/[id]/route.ts
app/api/v1/alerts/route.ts
app/api/v1/devices/[id]/alerts/route.ts
app/api/v1/devices/[id]/events/route.ts
app/api/v1/events/route.ts
docs/API.md
docs/SPRINT_3_COMPLETION_REPORT.md
docs/TESTING.md
docs/adr/0004-alert-lifecycle-and-event-contracts.md
modules/alerting/application/alert-contracts.ts
modules/alerting/application/alert-errors.ts
modules/alerting/application/alert-repository.ts
modules/alerting/application/alert-service.ts
modules/alerting/domain/alert.test.ts
modules/alerting/domain/alert.ts
modules/alerting/infrastructure/alert-service.ts
modules/alerting/infrastructure/prisma-alert-repository.ts
modules/alerting/presentation/AlertActions.test.tsx
modules/alerting/presentation/AlertActions.tsx
modules/alerting/presentation/AlertList.tsx
modules/alerting/presentation/alert-query.ts
modules/event-log/application/event-contracts.ts
modules/event-log/application/event-repository.ts
modules/event-log/application/event-service.ts
modules/event-log/domain/event.ts
modules/event-log/infrastructure/event-service.ts
modules/event-log/infrastructure/prisma-event-repository.ts
modules/event-log/presentation/EventTimeline.tsx
modules/event-log/presentation/event-query.ts
prisma/migrations/20260726150000_sprint_3_alerts_and_events/migration.sql
tests/e2e/sprint-three-alerts-events.spec.ts
tests/integration/alert-event-repository.test.ts
tests/integration/alert-event-routes.test.ts
```

Modified:

```text
CHANGELOG.md
README.md
app/(operations)/alerts/page.tsx
app/(operations)/devices/[id]/page.tsx
app/(operations)/events/page.tsx
components/layout/AppShell.tsx
docs/IMPLEMENTATION_ASSUMPTIONS.md
docs/IMPLEMENTATION_ROADMAP.md
docs/REQUIREMENTS_TRACKER.md
lib/api.ts
modules/README.md
modules/identity/domain/permissions.ts
modules/inventory/application/device-contracts.ts
modules/inventory/infrastructure/prisma-device-repository.ts
modules/inventory/presentation/DeviceList.tsx
playwright.config.ts
prisma/README.md
prisma/schema.prisma
prisma/seed.ts
scripts/README.md
scripts/reset-test-database.ts
tests/e2e/sprint-two-devices.spec.ts
tests/integration/device-repository.test.ts
tests/integration/device-routes.test.ts
```
