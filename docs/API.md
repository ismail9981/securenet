# SecureNet Demo REST API

All `/api/v1` routes return `{ "data": ... }` on success or the established
`{ "error": { "code", "message", "correlationId", "fieldErrors"? } }` envelope.
Authentication uses the signed HttpOnly Demo session. Lifecycle mutations also
require a same-origin request and server-side `ACKNOWLEDGE_ALERTS` permission.

## Alerts

`GET /api/v1/alerts` accepts `page` (default 1), `pageSize` (default 20, maximum
100), repeatable or comma-separated `severity` and `status`, `deviceId`, `from`,
and `to`. Ordering is `openedAt DESC`, then ID.

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
`severity`, `from`, `to`, and `search`. Ordering is `createdAt DESC`, then
monotonic ID. `meta.nextCursor` is opaque and must be returned unchanged.

Events have no create/update/delete public endpoint.

## Device history

`GET /api/v1/devices/{id}/alerts` and `/events` use the corresponding query
contracts and require an active Device Details target. Global Alert/Event results
continue to include archived device identity and an `archived` flag.

The internal accepted-metric-batch evaluator is not a public route. Sprint 5 may
call the application service after telemetry acceptance; Sprint 4 adds no
scheduler, simulation, WebSocket, or client-published transport.

## Topology

`GET /api/v1/topology` requires an authenticated Demo session and returns an
active snapshot containing Device nodes and `NetworkConnection` links. Nodes
include identity, hostname, type, status, and nullable location metadata. Links
include canonical endpoints, type, status, nullable label, and nullable
`bandwidthCapacityMbps`. Archived Devices and links touching them are excluded.
`parentDeviceId` is not rendered as a link. There are no connection mutation or
saved-position endpoints.

## Realtime

`GET /api/v1/realtime` requires the existing signed HttpOnly session cookie and a
same-origin browser request. It accepts no query token and no client messages.
The response is `text/event-stream` with a 15-second retry hint, a heartbeat every
20 seconds, and a 60-second connection lifetime. Limits are three streams per
authenticated user and 50 total Demo streams.

Named events carry a version-1 envelope with a unique UUID `eventId`, UTC
timestamp, entity identity, nullable correlation ID, and allow-listed payload.
Supported types are `device.updated`, `alert.created`, `alert.updated`, and
`event.created`. Messages are at most 64 KB. Delivery is process-local and
non-durable; clients suppress duplicates and recover authoritative state through
REST, using five-second polling only while SSE is unavailable.
