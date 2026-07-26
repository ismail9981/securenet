# Sprint 2 completion report

- Sprint: 2 — Device Inventory, Device Details, Database Foundation, Device API,
  and Device RBAC
- Completed: 2026-07-26
- Result: Complete and validated
- Branch: `main`
- Baseline: validated Sprint 0 and Sprint 1 commits, including the Demo credential
  correction

## Delivered

Sprint 2 introduces PostgreSQL as the sole persistence engine for the Device
module. Prisma provides the server-only adapter behind repository and application
service boundaries. The additive migration and deterministic idempotent seed
create:

| Fixture                            | Count |
| ---------------------------------- | ----: |
| Demo audit-reference users         |     3 |
| Locations                          |     3 |
| Active devices                     |    30 |
| Hourly device metric snapshots     |   720 |
| Metric snapshots per seeded device |    24 |

The stable audit-user UUIDs match the three Sprint 1 Demo session identities, but
authentication, password verification, signed sessions, and user lifecycle remain
outside PostgreSQL.

Implemented Device capabilities include:

- REST list, search, type/status/location filters, stable sorting, bounded
  pagination, details, and cursor-based metric history;
- a responsive Device List and Device Details UI with loading, empty, error,
  unauthorized, not-found, stale, and unavailable-data states;
- latest/current metric snapshot presentation, including nullable
  `uptimeSeconds`;
- nullable `parentDeviceId` persistence and contracts as topology groundwork only;
- Administrator create, update, and confirmed soft archive;
- authoritative server-side read-only enforcement for Network Engineer and Viewer;
- active-only hostname/IP uniqueness with `DEVICE_HOSTNAME_CONFLICT` and
  `DEVICE_IP_CONFLICT` HTTP 409 responses;
- transactionally coupled append-only audit records for device mutations; and
- preserved devices, metrics, and audit history after archive.

`activeAlertCount` remains `null`. The Sprint 1 Dashboard repository and fixtures
remain unchanged and disconnected from PostgreSQL.

## Database safety and migration evidence

- `DATABASE_URL` was positively identified as `securenet_dev` under the
  `securenet` role before implementation.
- `TEST_DATABASE_URL` was positively identified as `securenet_test` under the
  `securenet` role before implementation.
- No credentials or full connection URLs were printed or committed.
- `prisma validate`: passed.
- `prisma generate`: passed with aligned Prisma 7.8 CLI/client/adapter packages.
- `prisma migrate status`: one migration found and database schema up to date for
  both development and test.
- Two consecutive `npm run db:test:reset` executions passed.
- A reset attempt with the development URL supplied as `TEST_DATABASE_URL` was
  refused before data mutation.
- Final development seed counts: `3 users / 3 locations / 30 active devices /
720 metrics`.
- Final test seed counts: `3 users / 3 locations / 30 active devices /
720 metrics / 0 audit rows`.

The migration is additive. Rollback requires a backup restoration or reviewed
forward-fix migration; no destructive development/production reset is provided.

## Automated validation evidence

| Gate                                          | Result                         |
| --------------------------------------------- | ------------------------------ |
| Prettier formatting check                     | Passed                         |
| ESLint with zero warnings                     | Passed                         |
| Next route generation and TypeScript checking | Passed                         |
| Unit/integration/route/component tests        | 64 passed, 0 failed, 0 skipped |
| Coverage collection                           | Passed                         |
| Production build                              | Passed                         |
| Prisma validation and client generation       | Passed                         |
| Development/test migration status             | Passed                         |
| Installed dependency tree (`npm ls`)          | Passed                         |
| `npm audit`                                   | 0 vulnerabilities              |
| Desktop Playwright                            | 18 passed, 0 failed, 0 skipped |
| Mobile Playwright                             | 18 passed, 0 failed, 0 skipped |
| Combined Playwright/axe suite                 | 36 passed, 0 failed, 0 skipped |

Coverage collected across the selected application surface was 72.84% statements,
57.39% branches, 79.56% functions, and 74.43% lines. This is recorded as evidence,
not as a claim that later modules are covered.

The production route manifest includes:

- `/api/v1/devices`
- `/api/v1/devices/[id]`
- `/api/v1/devices/[id]/metrics`
- `/devices`
- `/devices/[id]`

## HTTP smoke evidence

The production build was started locally against `securenet_test`. Results:

| Request/behavior                     | Expected | Actual |
| ------------------------------------ | -------: | -----: |
| Administrator login                  |      200 |    200 |
| Network Engineer login               |      200 |    200 |
| Viewer login                         |      200 |    200 |
| Viewer list/search                   |      200 |    200 |
| Network Engineer details             |      200 |    200 |
| Viewer metric history                |      200 |    200 |
| Administrator create                 |      201 |    201 |
| Administrator update                 |      200 |    200 |
| Network Engineer mutation            |      403 |    403 |
| Administrator confirmed soft archive |      200 |    200 |
| Ordinary read after archive          |      404 |    404 |

The smoke response contract also confirmed a five-row metric page, non-null seeded
uptime, and `activeAlertCount: null`.

## Defect correction during validation

Browser validation exposed a local same-origin mismatch: the browser used
`127.0.0.1` while the framework normalized the internal request host to
`localhost`. Mutation requests were incorrectly denied. The check now accepts
only an exact host match or equivalent loopback hosts on the same port, rejects
malformed/cross-origin values, and falls back to the parsed request host when a
synthetic route-test request omits a Host header. Focused route tests and the full
36-case browser suite passed after correction.

## Traceability status

Verified in full:

- FR-003
- PRD-DEV-001 through PRD-DEV-006, including the approved Sprint 2 pull-forward
  of P1 PRD-DEV-005
- PRD-DD-001, PRD-DD-002, and PRD-DD-005
- SRS-FR-003, SRS-FR-004, and SRS-FR-005

Kept `In Progress`:

- FR-004 until every later-module device reference exists and links to details;
- FR-005 and PRD-DD-003 because the UI does not provide history charts or range
  selection;
- PRD-DD-004 because Alerts and the full Event Log remain later work; and
- system-wide SRS-FR-002, SRS-FR-009, SRS-FR-010, SRS-FR-012, and release-wide
  non-functional requirements, despite verified Sprint 2 Device evidence.

## Explicitly not delivered

Sprint 2 does not include realtime transport, polling, simulation, automatically
changing metrics, alert models/evaluation/lifecycle, a full Event Log UI,
interactive topology or React Flow, metric-history charts or range interaction,
the complete Health Score formula, reports, notifications, production deployment,
production identity, registration/recovery/OAuth, or user-management UI.

Sprint 3 was not started.
