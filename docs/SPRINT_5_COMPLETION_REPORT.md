# Sprint 5 completion report

- Completed: 2026-07-26
- Baseline: `main` at approved Sprint 4 commit `7e6d713`; tag `v0.4.0`
- Scope: deterministic Demo simulation runtime, persisted Dashboard data, and
  Administrator-only run controls
- Outcome: Sprint 5 implemented and validated; Sprint 6 not started

## Delivered requirements

The passing evidence verifies FR-006, FR-012, PRD-DASH-005, PRD-DASH-006, and
NFR-002 for the approved Sprint 5 scope. SRS-FR-011 remains `In Progress`
because reset is explicitly deferred to Sprint 6. FR-007 remains `In Progress`
because AR-BW-01 is disabled until a documented bandwidth-capacity formula
exists.

The implementation provides exactly six typed scenarios:
`SIM-CPU-OVERLOAD`, `SIM-RAM-LEAK`, `SIM-ROUTER-OFFLINE`,
`SIM-PACKET-LOSS`, `SIM-BW-SPIKE`, and `SIM-RECOVERY`. The duration, target,
seed, engine version, and input snapshot determine the generated output.
`SIM-MULTI-FAIL` is absent.

Run state is limited to `RUNNING`, `COMPLETED`, `CANCELLED`, and `FAILED`.
Administrator clients can start a run, view its status, and cancel it. There is
no reset, pause, resume, speed, arbitrary-incident, or hard-delete operation.

## Database migration and existing-data preservation

Migration `20260727100000_sprint_5_simulation` is additive. It:

- creates `SimulationStatus`, `MetricSource`, and `simulation_runs`;
- adds nullable `simulationRunId` relationships to DeviceMetric and Event;
- adds DeviceMetric `source`, defaulting to `MANUAL`;
- adds indexes, restrictive foreign keys, a progress check, and a partial unique
  simulated Device/batch index;
- marks the known deterministic Sprint 2 seed batch as `SEED`;
- contains no `DROP`, `TRUNCATE`, broad `DELETE`, or cascade removal.

Both `securenet_dev` and `securenet_test` reported all four migrations applied
and no pending migration. A reset command targeting `securenet_dev` was refused
before database access.

Two consecutive guarded `securenet_test` resets produced identical counts:

`3 users | 3 locations | 30 active devices | 720 metrics | 7 rules | 4 alerts |
5 events | 29 connections | 0 simulation runs`

The migration, reset, and repository suites verify that prior Metrics, Alerts,
Events, AuditLogs, Devices, and NetworkConnections are retained.

## Runtime, determinism, and concurrency

The separate Node worker is started with `npm run simulation:worker`. It obtains
a PostgreSQL advisory lock before executing, recovers orphaned `RUNNING` rows as
`FAILED` with `WORKER_RESTART_RECOVERY`, and does not silently resume work.

The version-1 dependency-free PRNG, injected clock, and deterministic UUID/batch
key generation make equal inputs reproducible and different seeds divergent.
The engine:

- evaluates active scenarios every five seconds;
- persists ordinary baseline Metrics every 60 seconds;
- persists checkpoints for start, important transitions, completion,
  cancellation, and failure;
- excludes archived Devices and preserves MAINTENANCE Devices;
- constrains CPU, RAM, ping, packet loss, download, and upload values to the
  documented behavior;
- leaves unsupported disk, uptime, and bandwidth-utilization data nullable;
- handles 30 Devices within the test performance budget.

Target-scoped PostgreSQL locks reject overlapping active runs while allowing
non-overlapping runs. Deterministic unique batch keys make repeated ticks
idempotent. Each accepted logical tick commits Metrics, Device state changes,
important Events, and the run checkpoint atomically.

## Alert, Event, Audit, and realtime integration

Accepted simulated Metric batches pass through the existing Alert evaluator
after the Metric transaction commits. Active-Alert deduplication and manual
Alert lifecycle behavior are unchanged. Recovery stops new triggers but never
automatically resolves an existing Alert.

The new Event taxonomy is limited to `SIMULATION_STARTED`,
`SIMULATION_COMPLETED`, `SIMULATION_CANCELLED`, and `SIMULATION_FAILED`, while
important Device transitions continue to use `DEVICE_STATUS_CHANGED`.
Administrative start/cancel operations append actor-linked
`simulation.run.started` and `simulation.run.cancelled` AuditLogs.

Committed realtime messages use the existing authenticated SSE endpoint.
`simulation.status` is filtered to Administrators. Authorized ordinary
`device.updated`, `alert.created`, `alert.updated`, and `event.created` messages
remain available to their existing consumers. A compact PostgreSQL
`LISTEN/NOTIFY` bridge carries committed worker messages to the separate web
process; origin-process identifiers prevent duplicate local delivery. Realtime
publication failure cannot roll back persisted business data.

## Dashboard and user experience

Runtime Dashboard reads Device totals/statuses, critical Alert count, recent
Alerts, recent Events, traffic history, and the approved partial Health Score
from PostgreSQL. The deterministic fixture adapter and its tests remain intact.
The page keeps its Demo and incomplete-formula disclosures and does not claim
live real-device monitoring.

The Administrator-only control provides scenario and valid-target selection,
documented duration/effect text, confirmation, progress/status feedback, and
cancel. Network Engineer and Viewer receive no control and are rejected by every
simulation API. Desktop Chromium and the 320-pixel mobile project cover
keyboard operation, focus handling, reduced motion, and axe accessibility.

## API surface

The production route manifest contains only:

- `POST /api/v1/simulation/runs`
- `GET /api/v1/simulation/runs/{id}`
- `POST /api/v1/simulation/runs/{id}/cancel`

Routes require a valid signed Administrator session. Mutation routes enforce
same-origin requests, strict Zod schemas, an allow-listed scenario, bounded
targets, rate limits, idempotency, stable error envelopes, and redacted internal
failures. No reset endpoint or undocumented simulation control route exists.

## Validation evidence

| Gate                                  | Result                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| Branch/baseline/tag/pre-scope review  | `main`; `7e6d713`; `v0.4.0`; initially clean; Sprint 5 absent                    |
| Database targets                      | Development `securenet_dev`; test `securenet_test`; no URL or credential printed |
| `npm ci`                              | Passed; 620 packages installed from lockfile                                     |
| `npm ls --depth=0`                    | Passed; dependency tree valid                                                    |
| Formatting                            | Passed                                                                           |
| ESLint                                | Passed with zero warnings                                                        |
| TypeScript                            | Passed                                                                           |
| Prisma validate/generate              | Passed                                                                           |
| Migration deploy/status               | Passed on development and test; four migrations current                          |
| Reset safety                          | Development target refused; two deterministic test resets passed                 |
| Vitest full suite                     | 39 files; 145 passed, 0 failed, 0 skipped                                        |
| Final non-database regression         | 25 files; 84 passed, 0 failed, 0 skipped                                         |
| Playwright full suite                 | 56 passed, 0 failed, 0 skipped                                                   |
| Desktop/mobile/axe/keyboard/motion    | Passed in the full Playwright suite                                              |
| Five-second and ten-second visibility | Passed strict five-second desktop timing and full E2E                            |
| Worker lifecycle/lock/recovery        | Passed unit, PostgreSQL integration, and E2E checks                              |
| HTTP/API/RBAC/SSE smoke               | Passed through route integration and the served Playwright runtime               |
| Production build                      | Passed; approved route manifest reviewed                                         |
| `npm audit`                           | Passed; 0 vulnerabilities                                                        |
| Source/client secret scans            | 0 actual source-secret or client-bundle matches                                  |
| Baseline immutability                 | 0 modified files under `docs/baseline/`                                          |

The authoritative release-suite count is **201 passing, 0 failing, and 0
skipped tests**: 145 Vitest plus 56 Playwright. Focused reruns and the final
84-test non-database regression are supporting evidence and are not
double-counted.

## Security and database safety

Sprint 1 authentication, signed HttpOnly sessions, and server-side RBAC are
unchanged. Simulation APIs are Administrator-only, same-origin protected,
validated, rate-limited, and bounded. Worker and database details are never sent
through the API or SSE. Environment values and complete database URLs were not
printed, logged, committed, or bundled for the client.

The reset script still requires the positively identified exact database name
`securenet_test`. Development data was upgraded only through the additive
migration. No destructive reset, retention purge, or hard deletion was added.

No new runtime dependency was required for simulation. The worker uses the
existing PostgreSQL/Prisma stack and a small in-repository PRNG. Dependency-tree
review passed and the audit reports zero vulnerabilities.

## Preserved and deferred boundaries

AR-BW-01 remains disabled. No bandwidth-utilization formula or utilization Alert
was introduced. Existing Alerts are never automatically resolved.

FR-007, SRS-FR-011, the complete Health Score, selected-range historical charts,
reset, pause/resume, speed controls, multi-failure scenarios, topology overlays,
path highlighting, link-capacity changes, saved layout, scheduled deletion,
distributed scheduling, Redis/queues, reports, notifications, production
deployment, and user-management UI remain `In Progress`, deferred, or outside
Sprint 5 as documented.

Sprint 6 was not started. No GitHub push or release tag was created.

## Files

Created:

- `app/api/v1/simulation/runs/route.ts`
- `app/api/v1/simulation/runs/[id]/route.ts`
- `app/api/v1/simulation/runs/[id]/cancel/route.ts`
- `docs/OPERATIONS.md`
- `docs/SPRINT_5_COMPLETION_REPORT.md`
- `docs/adr/0006-simulation-runtime-and-scenarios.md`
- `modules/monitoring/infrastructure/prisma-dashboard-repository.ts`
- `modules/realtime/infrastructure/postgres-realtime-bridge.ts`
- `modules/simulation/application/simulation-contracts.ts`
- `modules/simulation/application/simulation-errors.ts`
- `modules/simulation/application/simulation-repository.ts`
- `modules/simulation/application/simulation-runtime.test.ts`
- `modules/simulation/application/simulation-runtime.ts`
- `modules/simulation/application/simulation-service.ts`
- `modules/simulation/domain/engine.ts`
- `modules/simulation/domain/prng.ts`
- `modules/simulation/domain/scenarios.ts`
- `modules/simulation/domain/simulation.test.ts`
- `modules/simulation/infrastructure/postgres-worker-lock.ts`
- `modules/simulation/infrastructure/prisma-simulation-repository.ts`
- `modules/simulation/infrastructure/simulation-rate-limit.test.ts`
- `modules/simulation/infrastructure/simulation-rate-limit.ts`
- `modules/simulation/infrastructure/simulation-realtime.ts`
- `modules/simulation/infrastructure/simulation-service.ts`
- `modules/simulation/presentation/SimulationControl.test.tsx`
- `modules/simulation/presentation/SimulationControl.tsx`
- `prisma/migrations/20260727100000_sprint_5_simulation/migration.sql`
- `scripts/simulation-worker.ts`
- `scripts/start-test-runtime.ts`
- `tests/e2e/sprint-five-simulation.spec.ts`
- `tests/integration/dashboard-repository.test.ts`
- `tests/integration/simulation-repository.test.ts`
- `tests/integration/simulation-routes.test.ts`
- `tests/integration/simulation-worker-lock.test.ts`
- `tests/integration/sprint-five-migration.test.ts`

Modified:

- `CHANGELOG.md`, `README.md`
- `app/(operations)/dashboard/page.tsx`
- `app/api/v1/realtime/route.ts`
- `components/realtime/RealtimeProvider.tsx`
- `docs/API.md`, `docs/IMPLEMENTATION_ASSUMPTIONS.md`,
  `docs/IMPLEMENTATION_ROADMAP.md`, `docs/REQUIREMENTS_TRACKER.md`,
  `docs/SECURITY.md`, `docs/TESTING.md`
- `lib/api.ts`
- `modules/README.md`
- `modules/event-log/application/event-contracts.ts`,
  `modules/event-log/domain/event.ts`,
  `modules/event-log/infrastructure/prisma-event-repository.ts`,
  `modules/event-log/presentation/EventTimeline.tsx`
- `modules/inventory/application/device-contracts.ts`,
  `modules/inventory/infrastructure/prisma-device-repository.ts`,
  `modules/inventory/presentation/DeviceMetricSnapshot.test.tsx`
- `modules/monitoring/application/dashboard-contracts.ts`,
  `modules/monitoring/presentation/TrafficChart.tsx`
- `modules/realtime/application/realtime-contracts.ts`,
  `modules/realtime/infrastructure/in-process-realtime-publisher.test.ts`,
  `modules/realtime/infrastructure/in-process-realtime-publisher.ts`
- `package.json`, `playwright.config.ts`
- `prisma/README.md`, `prisma/schema.prisma`, `prisma/seed.ts`
- `scripts/README.md`, `scripts/reset-test-database.ts`

No immutable file under `docs/baseline/` was modified.
