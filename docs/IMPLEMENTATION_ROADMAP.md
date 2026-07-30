# SecureNet implementation roadmap

This roadmap follows DOC-000’s approved sprint sequence and preserves DOC-001
scope/priority precedence.

| Sprint                                   | Approved outcome                                                                                                                                    | Principal requirements                                                  | Exit evidence                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 0 — Foundation                           | Repository, tooling, modular boundaries, design tokens, P0 route placeholders, shared states, core types, docs, test harness                        | SRS-NFR-006, NFR-004/005/007/010 foundations                            | Format, lint, type-check, unit tests, production build, local run                |
| 1 — Identity, shell, dashboard contracts | Resolve Login priority conflict; implement real sessions/server authorization; dashboard static composition and application contracts               | FR-001/002/013, PRD-AUTH-001—003, PRD-DASH-001—005, SRS-FR-001/002/012  | Auth/RBAC unit and integration tests; dashboard contract/component tests         |
| 2 — Devices and telemetry                | PostgreSQL device list/details, safe queries, Administrator create/update/archive, audit context, persisted 24-hour metrics, and latest-snapshot UI | FR-003—005, PRD-DEV-001—006, PRD-DD-001—005, SRS-FR-002—005/009/010/012 | Prisma/database/API/device tests; responsive and accessible role-based flows     |
| 3 — Alerts and events                    | Threshold evaluation, deduplication, lifecycle, audited actions, append-only event log                                                              | FR-007—010, PRD-ALT-001—004, PRD-EVT-001—003, SRS-FR-006/007/010        | TC-ALT and event tests; baseline conflicts resolved before schema/API lock       |
| 4 — Topology and realtime                | Nodes/connections, state cues, accessible list fallback, compact events, reconnect and snapshot fallback                                            | FR-011, PRD-TOP-001—003, SRS-FR-008                                     | Topology accessibility and 30-node checks; realtime integration tests            |
| 5 — Simulation engine                    | Deterministic baseline generation, approved scenarios, Administrator run/status/cancel controls, and runtime Dashboard effects                      | FR-006/007/012/013, PRD-DASH-005/006, SRS-FR-006/007/008/011/012        | Seeded, worker/concurrency, and TC-SIM-001 end-to-end evidence                   |
| 6 — Reports, settings, and RBAC polish   | Approved P1 report/CSV, global settings, alert-rule controls, shared filters, historical Metrics, saved topology positions, and role UX polish      | FR-014/015, PRD-REP-001/002, PRD-SET-001/002, PRD-TOP-005               | Role matrix, report/export, settings, history, topology, and accessibility tests |
| 7 — QA, security, deployment, portfolio  | Full regression, accessibility, performance, security, CI/CD, managed deployment, truthful portfolio evidence                                       | All AC-01—12 and release gates                                          | 0 blocker/critical defects; release report, live demo, README/video/case study   |

## Sprint 1 resolution

The approved clarification resolved IA-001 and IA-004 for Sprint 1. Sprint 1 uses a
Demo-only identity adapter, signed server-verified sessions, server authorization
primitives, typed Dashboard contracts, deterministic fixtures, and only the
unambiguous Health Score deductions. ADR-0002 records the limitations.

Sprint 2 may begin only after Sprint 1 validation and separate approval. Device
persistence, telemetry, alert processing, realtime transport, simulation, and the
unresolved Health Score factors are not pulled forward.

## Sprint 2 resolution

The approved Sprint 2 decision pulls PRD-DEV-005 forward while keeping mutations
Administrator-only and defining API deletion as soft archive. PostgreSQL/Prisma
store devices, locations, deterministic 24-hour metrics, Demo audit principals,
and append-only device-operation audit records. The UI shows only the latest metric
snapshot; historical charts and range selection remain In Progress. Sprint 1
identity and Dashboard fixtures remain unchanged and disconnected from PostgreSQL.

## Sprint 3 resolution

The approved Sprint 3 decisions establish a four-state Alert lifecycle, an
explicit investigate command, role-specific resolution transitions, transactional
Event/Audit recording, active device/rule deduplication, permanent append-only
Event retention, and preserved archived-device history. AlertRule gains
`consecutiveSamples`; bandwidth evaluation remains deferred because link capacity
does not exist.

Threshold evaluation is a synchronous internal application boundary only.
Scheduler, worker, simulation, polling, WebSocket, SSE, realtime UI, topology,
AlertRule management UI, reports, notifications, and user management remain in
their approved later sprints. The Sprint 1 Dashboard fixture repository remains
unchanged.

## Sprint 4 resolution

The approved Sprint 4 decisions make `NetworkConnection` the sole source of
rendered topology links and retain `parentDeviceId` as unrelated hierarchy
metadata. Active snapshots omit archived Devices and their links while preserving
all connection rows. The client uses a deterministic non-persisted layout and a
complete accessible list; connection CRUD and saved positions remain deferred.

Realtime uses authenticated same-origin SSE with a single-instance in-process
publisher, REST snapshot recovery, and five-second polling only during SSE
unavailability. Publications occur after successful database commits and cannot
roll back business operations. Consumers are limited to Topology status, the
shell indicator, Alerts, and Events. Dashboard fixtures remain unchanged,
bandwidth evaluation remains disabled, and Sprint 5 simulation is not started.

## Sprint 5 resolution

The approved Sprint 5 decisions pull only start, run status, and cancellation
controls forward with deterministic baseline/scenario execution. A separate
single-instance Node worker uses PostgreSQL advisory and target locks, versioned
seeded generation, idempotent batches, restart-to-failed recovery, and a compact
PostgreSQL bridge to the existing authenticated SSE hub.

The runtime Dashboard selects a PostgreSQL-backed implementation of its existing
repository port while retaining the fixture adapter. Alert evaluation follows
committed batches, active deduplication remains, and recovery never
auto-resolves Alerts. AR-BW-01 stays disabled and FR-007 remains In Progress.
Reset, pause, resume, speed, incident overlays, Reports, Settings, users, purge
jobs, production deployment, and every other Sprint 6+ capability remain
deferred.

## Sprint 6 resolution

Sprint 6 implements the bounded Network Health Report and Alerts CSV export,
validated URL-backed shared filters, one global presentation-only SystemSetting,
Administrator-only mutable AlertRule fields, the approved historical Metric
ranges, and Administrator-saved topology positions. It preserves every prior
operational record and keeps authoritative authorization in server use cases.

User management, Demo reset, Alert recurrence/reopen, incident overlays,
printable/PDF output, arbitrary report families, automatic Alert resolution,
bandwidth utilization, AR-BW-01 activation, deployment, v1.0 release work, and
all Sprint 7 gates remain deferred.

## Sprint 7 resolution

Sprint 7 prepares a manually deployed Render Demo using one Web, one Worker, and
one paid PostgreSQL 17 database. It adds fail-closed environment policy,
Viewer-only public production login, health endpoints, structured redacted logs,
correlation IDs, graceful shutdown, guarded empty-only bootstrap, CI validation,
restore safety tooling, and release/portfolio checklists.

The accepted v1 scope keeps a fixed 24-hour Dashboard trend, Device Details
history from 1 hour through 30 days, CPU/RAM/Ping/Packet Loss/status alert rules,
disabled AR-BW-01, and a visibly partial Health Score. Deployment, hosted proof,
`v0.7.0`, Product Owner Go/No-Go, and `v1.0.0` require separate approvals.
