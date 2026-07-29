# SecureNet Demo REST API

All `/api/v1` routes return `{ "data": ... }` on success or the established
`{ "error": { "code", "message", "correlationId", "fieldErrors"? } }` envelope.
Authentication uses the signed HttpOnly Demo session. Lifecycle mutations also
require a same-origin request and server-side `ACKNOWLEDGE_ALERTS` permission.

## Alerts

`GET /api/v1/alerts` accepts `page` (default 1), `pageSize` (default 20, maximum
100), repeatable or comma-separated `severity` and `alertStatus`, `deviceId`,
`from`, and `to`. The date range is at most 30 days. Ordering is `openedAt DESC`,
then ID.

`GET /api/v1/alerts/{id}` returns canonical rule, source, device, actor, assignee,
note, and lifecycle timestamps.

`POST /api/v1/alerts/{id}/acknowledge` accepts `{ "note"?: string }` and permits
Admin or Network Engineer for `OPEN`.

`POST /api/v1/alerts/{id}/investigate` accepts `{}` and permits Admin or Network
Engineer for `ACKNOWLEDGED`.

`POST /api/v1/alerts/{id}/resolve` accepts `{ "resolutionNote"?: string,
"overrideReason"?: string }`. Admin may resolve every active state; direct
`OPEN` resolution requires `overrideReason`. Network Engineer may resolve only
acknowledged or investigating Alerts, and only after the condition clears.

Stable domain errors are `ALERT_NOT_FOUND`, `ALERT_INVALID_STATE`,
`ALERT_OVERRIDE_REASON_REQUIRED`, `ALERT_CONDITION_NOT_CLEARED`, and
`ALERT_ACTIVE_CONFLICT`.

## Events

`GET /api/v1/events` accepts opaque `cursor`, `limit` (default 50, maximum 100),
`deviceId`, `alertId`, `actorUserId`, repeatable or comma-separated `type` and
`severity`, `alertStatus`, `deviceStatus`, `from`, `to`, and `search`. The date
range is at most 30 days. Ordering is `createdAt DESC`, then monotonic ID.
`meta.nextCursor` is opaque and must be returned unchanged.

Events have no create/update/delete public endpoint.

## Device history

`GET /api/v1/devices/{id}/alerts` and `/events` use the corresponding query
contracts and require an active Device Details target. Global Alert/Event results
continue to include archived device identity and an `archived` flag.

The internal accepted-metric-batch evaluator is not a public route. Sprint 5 may
call the application service after telemetry acceptance; Sprint 4 adds no
scheduler, simulation, WebSocket, or client-published transport.

`GET /api/v1/devices/{id}/metrics` accepts `range` as `1h`, `6h`, `12h`, `24h`,
or `7d`. It returns raw rows for short ranges and server-side interval aggregates
for longer ranges, with at most 500 samples and explicit unavailable values.

## Topology

`GET /api/v1/topology` requires an authenticated Demo session and returns an
active snapshot containing Device nodes and `NetworkConnection` links. Nodes
include identity, hostname, type, status, and nullable location metadata. Links
include canonical endpoints, type, status, nullable label, and nullable
`bandwidthCapacityMbps`. Archived Devices and links touching them are excluded.
`parentDeviceId` is not rendered as a link. Saved positions are included when
available; deterministic layout remains the fallback.

`PUT /api/v1/topology/positions` requires Administrator permission and a
same-origin request. It accepts a bounded partial array of active Device UUIDs
with finite `x` and `y` coordinates and saves the batch transactionally.

## Reports

`GET /api/v1/reports/network-health` requires an authenticated session and
accepts validated `from`, `to`, optional `deviceId`, repeatable or
comma-separated `severity`, `alertStatus`, and `deviceStatus`. The range is at
most 30 days. It returns the documented summary, partial Health Score disclosure,
device status/type distribution, top ten Devices, and recent Alerts.

`GET /api/v1/reports/alerts.csv` uses the same bounded filters and requires an
Administrator. It returns at most 10,000 Alerts as UTF-8 CSV with a BOM, CRLF
rows, stable columns, UTC ISO timestamps, and empty cells for unavailable values.
Spreadsheet-formula prefixes are neutralized. A successful export appends the
`report.alerts.exported` AuditLog action.

## Settings and AlertRule administration

`GET /api/v1/settings` returns the global presentation timezone and units.
`PUT /api/v1/settings` requires an Administrator and same-origin request, accepts
only allow-listed values, and appends `settings.updated`.

`GET /api/v1/alert-rules` returns existing rules. `PATCH
/api/v1/alert-rules/{id}` requires an Administrator and same-origin request and
can change only the bounded mutable rule fields. Rule identity, scope, metric,
and operator are immutable. AR-BW-01 cannot be enabled. Successful updates append
`alert_rule.updated`.

## Realtime

`GET /api/v1/realtime` requires the existing signed HttpOnly session cookie and a
same-origin browser request. It accepts no query token and no client messages.
The response is `text/event-stream` with a 15-second retry hint, a heartbeat every
20 seconds, and a 60-second connection lifetime. Limits are three streams per
authenticated user and 50 total Demo streams.

Named events carry a version-1 envelope with a unique UUID `eventId`, UTC
timestamp, entity identity, nullable correlation ID, and allow-listed payload.
Supported types are `device.updated`, `alert.created`, `alert.updated`, and
`event.created`. Sprint 5 additionally permits `simulation.status` only for
Administrator streams. Its payload is limited to run ID, scenario code, status,
and integer progress. Messages are at most 64 KB. The simulation worker bridges
committed messages to the web process through PostgreSQL `LISTEN/NOTIFY`; REST
and PostgreSQL remain authoritative. Clients suppress duplicates and recover
through REST, using five-second polling only while SSE is unavailable.

## Simulation

All simulation controls require the signed Demo session, `RUN_SIMULATION`,
same-origin requests, strict validation, and the Administrator role.

`POST /api/v1/simulation/runs` starts one allow-listed scenario. It requires an
`Idempotency-Key` header and accepts a scenario code, 1–30 unique target Device
UUIDs, and an optional unsigned 32-bit seed. When omitted, a securely generated
seed is returned and persisted.

`GET /api/v1/simulation/runs/{id}` returns the public lifecycle, scenario,
targets, seed/version, duration, progress, timestamps, and safe result.

`POST /api/v1/simulation/runs/{id}/cancel` cancels a `RUNNING` run, restores
targets from scenario effects, persists a final checkpoint, and retains the last
committed progress.

Stable domain errors are `SIMULATION_SCENARIO_UNSUPPORTED`,
`SIMULATION_TARGET_INVALID`, `SIMULATION_TARGET_CONFLICT`,
`SIMULATION_RUN_NOT_FOUND`, `SIMULATION_RUN_NOT_ACTIVE`,
`SIMULATION_ACTIVE_CONFLICT`, `SIMULATION_IDEMPOTENCY_CONFLICT`,
`SIMULATION_WORKER_UNAVAILABLE`, and `SIMULATION_INVALID_STATE`.

There are no reset, pause, resume, speed, arbitrary-incident, or tick endpoints.
