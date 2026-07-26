# Sprint 4 completion report

- Completed: 2026-07-26
- Baseline: `main` at approved Sprint 3 commit `e87b064`; tag `v0.3.0`
- Scope: Topology persistence/API/UI and single-instance Demo realtime only
- Outcome: Complete and validated; Sprint 5 not started

## Delivered requirements

The passing evidence verifies FR-011, PRD-TOP-001, PRD-TOP-002,
PRD-TOP-003, and SRS-FR-008 for the approved Sprint 4 scope.

`NetworkConnection` is the only rendered-link source. Connections use canonical
endpoints, are visually undirected, reject self-links and same-type reverse
duplicates, and permit cycles, disconnected components, orphan Devices, and
multiple links. Active snapshots omit archived Devices and links touching them
without deleting history. `parentDeviceId` remains independent metadata.

The protected Topology experience provides deterministic layout, zoom, fit,
reset, status legend/cues, node summary, Device Details navigation, and a complete
accessible list. No connection CRUD, persisted positions, topology mutation, or
React Flow editing was introduced.

The read-only `/api/v1/realtime` route uses native authenticated same-origin SSE.
It supports only `device.updated`, `alert.created`, `alert.updated`, and
`event.created`; bounds messages at 64 KB; permits three connections per user and
50 total; sends a 20-second heartbeat and 15-second retry hint; and ends streams
after 60 seconds. The client suppresses duplicate/malformed messages, requests an
authoritative REST snapshot after reconnect, and polls every five seconds only
while SSE is unavailable.

Device, Alert, and Event publication occurs after successful transaction commit.
Publication failure is redacted and cannot roll back the business operation.
Consumers are limited to Topology status, Alerts, Events, and the shell
connection indicator.

## Database migration and seed

Migration `20260726210000_sprint_4_topology` is additive. It creates two enums and
`network_connections`, with UUID keys, restrictive Device foreign keys, positive
nullable capacity, canonical endpoint and no-self-link checks, a same-type
endpoint uniqueness constraint, and lookup indexes. It contains no drop,
truncate, destructive reset, or cascade deletion.

Both `securenet_dev` and `securenet_test` report all three migrations applied and
no pending migration. A reset attempt targeting `securenet_dev` was refused
before database access.

Two consecutive guarded `securenet_test` resets produced the same counts:

`3 users | 3 locations | 30 active devices | 720 metrics | 7 rules | 4 alerts |
5 events | 29 connections | 0 non-null capacities`

The test suite additionally verifies seed idempotence, additive migration
behavior, cycles, disconnected/orphan nodes, constraint enforcement, archived
snapshot exclusion, and preserved archived connection history.

## Validation evidence

| Gate                                 | Result                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| Branch/baseline/tag/pre-scope review | `main`; `e87b064`; `v0.3.0`; initially clean; Sprint 4 absent                           |
| Database target verification         | Development `securenet_dev`; test `securenet_test`; no URL/credential printed           |
| `npm ci`                             | Passed; 620 packages installed from lockfile                                            |
| `npm ls --depth=0`                   | Passed; dependency tree valid                                                           |
| Formatting                           | Passed                                                                                  |
| ESLint                               | Passed with zero warnings                                                               |
| TypeScript                           | Passed                                                                                  |
| Prisma validate/generate             | Passed                                                                                  |
| Migration deploy/status              | Passed on development and test; three migrations current                                |
| Reset safety                         | Development target refused; repeated test resets passed                                 |
| Vitest                               | 30 files; 115 passed, 0 failed, 0 skipped                                               |
| Playwright                           | 50 passed, 0 failed, 0 skipped                                                          |
| Production build                     | Passed; Topology and realtime page/API routes present                                   |
| `npm audit`                          | 0 vulnerabilities                                                                       |
| Secret/source scan                   | 0 actual secret or database-URL matches                                                 |
| Client bundle scan                   | 0 secret, URL, or sensitive-identifier matches                                          |
| HTTP/RBAC smoke                      | Login 200; unauthenticated Topology 401; Admin/Viewer Topology 200; Viewer mutation 403 |
| SSE smoke                            | Same-origin 200 stream; correct content type/retry prelude; cross-origin 403            |

The final authoritative count is **165 passing, 0 failing, and 0 skipped tests**
across Vitest and Playwright. Focused reruns used during defect correction are not
double-counted.

## Accessibility, responsive behavior, and performance

Playwright ran all 25 browser cases in desktop Chromium and all 25 at a 320-pixel
viewport. The suite covers keyboard operation, status text independent of color,
the complete list alternative, reduced motion, responsive shell behavior, and 14
axe page scans with no serious or critical findings.

Production-mode local measurements with the deterministic 30-node/29-link
snapshot were:

- usable Topology render: 697 ms (budget: at most 3,000 ms);
- node interaction: 16.7 ms (budget: at most 250 ms);
- committed realtime update visible: 198.6 ms (budget: at most 5,000 ms).

These are local Demo engineering measurements, not production service claims.

## Security and dependency review

Authentication remains the Sprint 1 Demo-only server adapter with signed HttpOnly
sessions. The SSE route accepts no query token or client publication and enforces
authentication, same-origin requests, stream limits, size limits, and redacted
failure logging. Forged/expired sessions, unauthenticated access, malformed
messages, duplicate events, cross-origin access, and limits have passing tests.

The sole new direct dependency is `@xyflow/react` 12.11.2 (MIT), required for the
approved graph UI. TanStack Query, Socket.IO, WebSocket libraries, Dagre, ELK,
Redis, and simulation dependencies were not added. The installed dependency audit
reports zero vulnerabilities.

## Preserved and deferred boundaries

The Sprint 1 Dashboard repository, counts, Health Score, traffic chart, Alert
fixtures, Event fixtures, and timestamp remain deterministic and disconnected
from PostgreSQL. Only the shell replaces “Realtime planned” with the connection
state. PRD-DASH-005 remains In Progress.

Connection capacity is nullable and all deterministic capacity values remain
null. AR-BW-01 stays disabled and FR-007 remains In Progress; no utilization
formula was invented.

Historical metric charts/range selection, complete Health Score logic, connection
management, saved Topology positions, distributed pub/sub, durable replay,
production identity/deployment, simulation, schedulers, workers, broader live
Device/Dashboard values, reports, notifications, and user-management UI remain
outside Sprint 4. No Sprint 5 implementation exists.

## Files

Created:

- `app/(operations)/topology/error.tsx`
- `app/(operations)/topology/loading.tsx`
- `app/api/v1/realtime/route.ts`
- `app/api/v1/topology/route.ts`
- `components/realtime/RealtimeIndicator.tsx`
- `components/realtime/RealtimeProvider.test.tsx`
- `components/realtime/RealtimeProvider.tsx`
- `docs/SECURITY.md`
- `docs/SPRINT_4_COMPLETION_REPORT.md`
- `docs/adr/0005-topology-and-realtime-architecture.md`
- `modules/realtime/application/realtime-contracts.ts`
- `modules/realtime/application/realtime-publisher.ts`
- `modules/realtime/infrastructure/in-process-realtime-publisher.test.ts`
- `modules/realtime/infrastructure/in-process-realtime-publisher.ts`
- `modules/topology/application/topology-repository.ts`
- `modules/topology/application/topology-service.ts`
- `modules/topology/domain/topology.test.ts`
- `modules/topology/domain/topology.ts`
- `modules/topology/infrastructure/prisma-topology-repository.ts`
- `modules/topology/infrastructure/topology-service.ts`
- `modules/topology/presentation/DeviceTopologyNode.tsx`
- `modules/topology/presentation/TopologyExplorer.test.tsx`
- `modules/topology/presentation/TopologyExplorer.tsx`
- `modules/topology/presentation/topology-layout.test.ts`
- `modules/topology/presentation/topology-layout.ts`
- `prisma/migrations/20260726210000_sprint_4_topology/migration.sql`
- `tests/e2e/sprint-four-topology-realtime.spec.ts`
- `tests/integration/sprint-four-migration.test.ts`
- `tests/integration/topology-realtime-routes.test.ts`
- `tests/integration/topology-repository.test.ts`

Modified:

- `CHANGELOG.md`, `README.md`
- `app/(operations)/alerts/page.tsx`, `app/(operations)/events/page.tsx`,
  `app/(operations)/topology/page.tsx`, `app/globals.css`
- `components/foundation/DemoDataBadge.tsx`,
  `components/layout/AppShell.tsx`
- `docs/API.md`, `docs/IMPLEMENTATION_ASSUMPTIONS.md`,
  `docs/IMPLEMENTATION_ROADMAP.md`, `docs/REQUIREMENTS_TRACKER.md`,
  `docs/TESTING.md`
- `modules/README.md`
- `modules/alerting/infrastructure/prisma-alert-repository.ts`,
  `modules/alerting/presentation/AlertList.tsx`
- `modules/event-log/presentation/EventTimeline.tsx`
- `modules/identity/presentation/UserMenu.tsx`
- `modules/inventory/infrastructure/prisma-device-repository.ts`
- `package.json`, `package-lock.json`
- `prisma/README.md`, `prisma/schema.prisma`, `prisma/seed.ts`
- `scripts/reset-test-database.ts`
- `tests/e2e/sprint-three-alerts-events.spec.ts`,
  `tests/e2e/sprint-two-devices.spec.ts`,
  `tests/integration/device-repository.test.ts`

No immutable file under `docs/baseline/` was modified.
