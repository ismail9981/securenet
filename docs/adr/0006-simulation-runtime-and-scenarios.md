# ADR-0006: Simulation runtime and scenarios

- Status: Accepted for Sprint 5
- Date: 2026-07-27
- Sources: approved Sprint 5 decisions S5-D01 through S5-D25; DOC-001,
  DOC-003, DOC-004, DOC-005, DOC-006, DOC-007, DOC-011, DOC-012, DOC-013

## Context

Sprint 5 introduces deterministic Demo metric generation and approved
incident/recovery scenarios. It extends the PostgreSQL, Alert, Event, topology,
Dashboard, and SSE boundaries approved in Sprints 1–4 without introducing
production monitoring or distributed scheduling.

## Decisions

Simulation runs persist only `RUNNING`, `COMPLETED`, `CANCELLED`, and `FAILED`.
Start, status, and cancel are the only controls. Stop means cancel; reset,
pause, resume, speed controls, and arbitrary incidents remain deferred.

A separate single-instance Node worker owns execution through a PostgreSQL
advisory lock. A newly owning worker marks orphaned `RUNNING` runs `FAILED` with
`WORKER_RESTART_RECOVERY`; it never silently resumes them. Runs may overlap only
when their target Devices do not. Logical ticks have deterministic batch keys
and duplicate Device/batch persistence is rejected idempotently.

The engine uses a versioned dependency-free seeded PRNG, an injected clock, and
a five-second cycle. Normal samples persist every 60 seconds, with additional
samples at scenario start, important threshold or Device-state transitions,
completion, cancellation, and failure. Each logical tick atomically persists
accepted Metrics, Device status changes, important Device Events, and run
progress. Supported Alert rules are evaluated after that commit. Realtime
messages are published only for committed state.

Approved scenarios and durations are CPU Overload (120 seconds), RAM Leak (180),
Router Offline (90), Packet Loss (120), Bandwidth Spike (90), and Network
Recovery (60). Multiple Device Failure is excluded. Disk, uptime, and bandwidth
utilization are not generated. AR-BW-01 remains disabled. Alerts never
auto-resolve.

`DeviceMetric.source` distinguishes `SEED`, `SIMULATION`, and `MANUAL`.
Metrics and Events may reference their originating SimulationRun. Existing seed
metrics are safely identified by their stable batch key and backfilled as
`SEED`; prior records receive no fabricated run relation.

Scenario definitions live in a typed application allow-list. No scenario table,
queue, Redis, external cron, purge job, or production worker service is added.
All Demo history remains preserved.

The runtime Dashboard uses a PostgreSQL-backed implementation of its existing
repository interface while the fixture adapter and tests remain available.
Simulation controls are visible only to Administrators. Topology receives only
existing `device.updated` status refreshes.

`simulation.status` is added to the version-1 SSE contract and is filtered to
Administrator subscribers. It contains only run ID, scenario code, status, and
integer progress. It never exposes parameters or worker internals.

## Failure semantics

Database failure rolls back the logical tick. Alert evaluation failure does not
delete an accepted Metric batch; the worker logs a redacted structured failure
and marks the run `FAILED` when safe continuation is impossible. Realtime
failure cannot roll back committed data. Cancellation retains last committed
progress, completion reports 100, and failure retains last committed progress.

## Limitations

This is deterministic local Demo infrastructure, not real-device monitoring or
production distributed scheduling. The worker is single-instance, restart
recovery fails rather than resumes work, Dashboard Health Score retains its
documented incomplete-formula disclosure, and bandwidth Alert evaluation remains
unavailable.
