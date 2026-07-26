# ADR-0003: PostgreSQL device persistence and Sprint 2 boundaries

- Status: Accepted for Sprint 2
- Date: 2026-07-26
- Sources: approved Sprint 2 plan and binding decisions; DOC-001, DOC-002,
  DOC-003, DOC-004, DOC-005, DOC-006, DOC-007, DOC-009, DOC-012, DOC-014

## Context

Sprint 2 replaces the Device route placeholders with PostgreSQL-backed inventory,
current metric presentation, and Administrator management workflows. The approved
baseline has several sequencing and contract gaps: device management is P1 in the
PRD but explicitly requested in Sprint 2; `DELETE` is named in the API while the
product requires archival; metric history is required but interactive history is
not in the approved Sprint 2 UI; audit records reference users while Sprint 1
identity must remain outside PostgreSQL; and DOC-005 omits approved uptime and
parent-device fields.

## Decisions

### Persistence and isolation

Use PostgreSQL as the only persistence engine and Prisma as the server-only
infrastructure adapter. Development uses `DATABASE_URL` targeting
`securenet_dev`; automated database tests use `TEST_DATABASE_URL` targeting
`securenet_test`. Destructive test reset tooling must positively identify the
`securenet_test` database before changing data.

Domain and application code remain independent from Prisma. Database operations
use versioned additive migrations, UUID public identifiers, UTC timestamps,
snake_case database names, active-only uniqueness, and append-only metrics and
audit records.

Prisma generates a usable PostgreSQL `inet` field, but its generated client does
not expose PostgreSQL `macaddr` as a supported application value. MAC addresses
therefore use normalized nullable `VARCHAR(17)` storage with a database check.
Rollback uses backup restoration or a reviewed additive forward-fix migration;
the guarded test reset is never a development or production rollback mechanism.

### Device management sequencing and RBAC

Pull PRD-DEV-005 forward into Sprint 2 without changing its baseline priority.
Administrator may read, create, update, and archive devices. Network Engineer and
Viewer may read device lists, filters, metrics, and details but may not mutate
devices. Authorization remains server-side in application use cases.

`DELETE /api/v1/devices/{id}` performs a soft archive after explicit UI
confirmation. It never deletes the device, metrics, or audit history.

### Metrics and relationships

Persist a deterministic 24-hour metric fixture history and expose the documented
metrics endpoint. Sprint 2 presentation uses only the latest/current snapshot.
Interactive history charts and range selection remain In Progress.

Add nullable `uptimeSeconds` to support the higher-precedence Device Details
requirement. Add nullable `parentDeviceId` as a self-referencing device
relationship for database and contract groundwork only. No topology behavior,
discovery, or React Flow is introduced.

### Demo audit principals

Persist three stable Demo User reference rows solely to satisfy the audit-log
foreign key. Map each signed Demo session identity to the same UUID. Authentication,
password verification, sessions, and user lifecycle remain the Sprint 1
server-only adapter and do not query PostgreSQL.

Device create, update, and archive operations write an append-only audit record in
the same transaction as the mutation.

### API compatibility

Duplicate active IP addresses return HTTP 409 with `DEVICE_IP_CONFLICT`.
Duplicate active hostnames return HTTP 409 with
`DEVICE_HOSTNAME_CONFLICT`. Database error details are never exposed.

`activeAlertCount` is `null` in Sprint 2 because Alert persistence belongs to
Sprint 3. It must not be represented as zero.

## Consequences

- Device inventory becomes the first PostgreSQL-backed product module.
- The audited Prisma 7.8 CLI, client, and PostgreSQL adapter versions remain aligned;
  patched transitive overrides are locked and validated through Prisma commands.
- Sprint 1 identity, sessions, RBAC primitives, and Dashboard fixtures remain
  unchanged and disconnected from PostgreSQL.
- Archived devices disappear from ordinary reads while their metrics and audit
  history remain stored.
- FR-005 and PRD-DD-003 remain In Progress after Sprint 2 because historical
  presentation and range interaction are not implemented.
- Alerts, full Event Log, realtime, topology, simulation, reports, production
  deployment, and user-management UI remain outside Sprint 2.
