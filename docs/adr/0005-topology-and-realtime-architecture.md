# ADR-0005: Topology and realtime architecture

- Status: Accepted for Sprint 4
- Date: 2026-07-26
- Sources: approved Sprint 4 decisions S4-D01 through S4-D17; DOC-001,
  DOC-002, DOC-003, DOC-004, DOC-005, DOC-006, DOC-007, DOC-009,
  DOC-010, DOC-012

## Context

Sprint 4 replaces the protected Topology placeholder and introduces connected
client updates without changing the approved Sprint 1 Dashboard fixtures or
pulling Sprint 5 simulation forward. The baseline documents topology nodes,
connections, status cues, compact realtime events, reconnect and REST snapshot
recovery, but leave graph semantics, transport details, and engineering limits
open.

## Decisions

### Topology graph

`NetworkConnection` is the only source of rendered links. The existing nullable
`Device.parentDeviceId` remains independent hierarchy metadata and is never
rendered as a topology edge.

Connections persist `sourceDeviceId` and `targetDeviceId` but are visually
undirected. Self-links are rejected. A connection of the same type between the
same two Devices is rejected in either direction. Cycles, disconnected
components, orphan nodes, multiple links per Device, and multiple connection
types between the same Device pair are allowed.

Archived Devices and their links are excluded from the active snapshot.
Connection rows remain preserved; no operational history is cascade-deleted.
Sprint 4 provides no connection CRUD or topology mutation controls.

The deterministic client layout follows the documented Internet/firewall/core/
access/endpoints hierarchy. Equal input produces equal coordinates. Persisted
positions and PRD-TOP-005 remain deferred.

### Persistence

Add the documented `NetworkConnection` model with `ETHERNET`, `WIFI`, `VPN`, and
`VIRTUAL` types; `ACTIVE`, `DEGRADED`, and `DOWN` statuses; nullable label; and
nullable `bandwidthCapacityMbps`. Capacity remains null in deterministic seed
data. AR-BW-01 remains disabled because no approved utilization formula exists.

The migration is additive. Check constraints enforce no self-link and canonical
undirected endpoint order. A unique constraint on canonical endpoints and type
prevents reverse duplicates. Foreign keys use restrictive deletion behavior.

### Realtime transport and recovery

Use a same-origin authenticated Server-Sent Events endpoint at
`GET /api/v1/realtime`. Authentication uses the existing signed HttpOnly session
cookie. Query-string tokens, client publication, WebSocket, Socket.IO, Redis,
managed messaging, workers, schedulers, and simulation are excluded.

The in-process publisher supports a single-instance Demo only. It has no
cross-instance fan-out or durable replay. A distributed deployment would require
approved managed pub/sub or Redis later.

Messages use a version-1 envelope with a unique UUID event ID, UTC timestamp,
event type, entity type and ID, nullable correlation ID, and allow-listed payload.
Approved event types are `device.updated`, `alert.created`, `alert.updated`, and
`event.created`. Messages are bounded to 64 KB. Clients suppress duplicate event
IDs and treat messages as cache invalidation signals; REST remains authoritative.

Publication occurs only after the database transaction commits and after its
Event/Audit writes. Publication failure never rolls back a committed business
operation and is logged without sensitive data.

The endpoint sends a heartbeat every 20 seconds, applies a 60-second idle
timeout, permits at most three connections per authenticated user and 50 Demo
connections in total, and supplies browser retry hints with a maximum reconnect
delay of 15 seconds. After reconnection, clients fetch an authoritative REST
snapshot before marking data current. Five-second polling runs only while SSE is
unavailable.

Realtime consumers are limited to Topology Device status, the application-shell
connection indicator, Alerts refresh for `alert.created`/`alert.updated`, and
Event Log refresh for `event.created`.

### Dashboard and later-sprint boundaries

The Sprint 1 Dashboard repository and all Dashboard values remain deterministic
fixtures disconnected from PostgreSQL. Only the shell's “Realtime planned”
presentation becomes a connection-state indicator. PRD-DASH-005 remains In
Progress.

Bandwidth utilization, `health.updated`, persisted layout, connection
management, Device Inventory/Details live refresh, background generation,
simulation, incident controls, and every Sprint 5 capability remain deferred.

### Engineering budgets

Sprint 4 Demo validation targets 30 nodes, at most 60 links, messages no larger
than 64 KB, at most three SSE connections per user and 50 total, a locally usable
topology within three seconds, node interaction within 250 ms, and a visible
realtime update within five seconds. These are Demo engineering budgets, not
production claims.

## Consequences

- Topology has a stable persisted graph independent from Device hierarchy.
- The accessible list is a complete functional alternative to the canvas.
- SSE keeps the approved flow server-to-client and uses native browser support.
- In-process delivery can miss events during restart or across instances; REST
  snapshot recovery and conditional polling provide eventual recovery.
- Existing Device, Metric, Alert, Event, AuditLog, identity, and Dashboard
  semantics remain unchanged.
- FR-007 and PRD-DASH-005 remain In Progress, and Sprint 5 is not started.
