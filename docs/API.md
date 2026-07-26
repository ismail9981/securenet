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
call the application service after telemetry acceptance; Sprint 3 adds no
scheduler, simulation, polling, WebSocket, or SSE.
