# SecureNet

SecureNet is a simulated Network Monitoring Center for understanding network health,
device state, alerts, operational events, and topology from one interface. Version
1.0 is a portfolio/demo product: it does **not** monitor a real network, discover
devices, or connect through SNMP, WMI, SSH, or agents.

This repository contains the Sprint 0–7 implementation: the application
foundation, Demo identity and Dashboard, PostgreSQL-backed Device Inventory,
synchronous alert evaluation, immutable operational history, active network
topology, authenticated Demo realtime refresh, deterministic simulation worker,
PostgreSQL-backed runtime Dashboard, bounded reports/CSV, global presentation
settings, historical Metrics, saved topology positions, and Render release
readiness. Authentication and
generated data remain deliberately demonstration-only; they must not protect or
represent a real monitored network.

## Approved stack

- Next.js App Router and React with strict TypeScript
- Tailwind CSS with project-owned design tokens and shadcn/ui planned component
  conventions
- Modular monolith with domain, application, infrastructure, and presentation
  boundaries
- Zod for boundary schemas and shared type inference
- bcrypt password verification and JOSE-signed HttpOnly Demo sessions
- Recharts for the deterministic accessible Dashboard trend
- React Flow for the interactive Topology canvas with a complete accessible list
- PostgreSQL 17 with Prisma for device, metric, Alert, Event, and audit persistence
- Vitest/Testing Library for unit, integration, and component tests; Playwright and
  axe-core for browser and accessibility tests
- Native Server-Sent Events with REST recovery and conditional polling
- TanStack Query, production identity, and distributed realtime adapters remain
  deferred

## Requirements

- Node.js 22 or newer
- npm 11 or newer
- PostgreSQL 17 with separate `securenet_dev` and `securenet_test` databases
- a local `AUTH_SECRET` containing at least 32 random characters

## Local setup

```bash
npm install
cp .env.example .env.local
# Set AUTH_SECRET, DATABASE_URL, and TEST_DATABASE_URL in .env.local.
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Run the independent deterministic Demo simulation worker in another terminal:

```bash
npm run simulation:worker
```

`DATABASE_URL` must target the development database. `TEST_DATABASE_URL` must
target exactly `securenet_test`; the reset command refuses every other database:

```bash
npm run db:test:reset
```

Open [http://localhost:3000](http://localhost:3000). The root route resolves through
the protected Dashboard flow and redirects unauthenticated users to `/login`.

The local login screen presents deterministic fictional accounts for
Administrator, Network Engineer, and Viewer so the RBAC matrix is repeatable.
All three accounts use the local Demo password
`SecureNetDemo123`, configured through `SEED_DEMO_PASSWORD`. Do not reuse that
password or this adapter for real data.

Production Demo policy exposes only Viewer. Administrator and Network Engineer
credentials and login remain private unless explicitly enabled by server-only
configuration. They must not appear in public documentation or client bundles.

| Role             | Email                     |
| ---------------- | ------------------------- |
| Administrator    | `admin@securenet.demo`    |
| Network Engineer | `engineer@securenet.demo` |
| Viewer           | `viewer@securenet.demo`   |

## Quality commands

```bash
npm run format:check
npm run lint
npm run type-check
npm test
npm run build
npm run test:e2e
```

Run the full static/unit/build gate with:

```bash
npm run validate
```

## Implemented routes

| Route                                  | Status                                                        |
| -------------------------------------- | ------------------------------------------------------------- |
| `/login`                               | Demo-only deterministic account login                         |
| `/dashboard`                           | Persisted Demo Dashboard and Administrator simulation control |
| `/devices`, `/devices/[id]`            | Persisted Device List and Device Details                      |
| `/api/v1/auth/login`, `/logout`, `/me` | Demo identity/session API                                     |
| `/api/v1/devices`                      | List/search/filter/sort/page and Administrator create         |
| `/api/v1/devices/{id}`                 | Details, Administrator update, and confirmed soft archive     |
| `/api/v1/devices/{id}/metrics`         | Persisted metric history API; latest snapshot rendered        |
| `/alerts`                              | Filtered Alert list/details and authorized lifecycle UI       |
| `/events`                              | Searchable immutable Event timeline with cursor paging        |
| `/api/v1/alerts`                       | Filtered, bounded Alert pagination                            |
| `/api/v1/alerts/{id}`                  | Alert details                                                 |
| `/api/v1/alerts/{id}/acknowledge`      | Admin/Engineer acknowledgement                                |
| `/api/v1/alerts/{id}/investigate`      | Admin/Engineer acknowledged-to-investigating transition       |
| `/api/v1/alerts/{id}/resolve`          | Role/state/condition-aware resolution                         |
| `/api/v1/events`                       | Filtered, searchable cursor-paginated Event history           |
| `/api/v1/devices/{id}/alerts`          | Active-device related Alert history                           |
| `/api/v1/devices/{id}/events`          | Active-device related Event history                           |
| `/topology`                            | Interactive active topology and accessible list               |
| `/api/v1/topology`                     | Authorized active Device/connection snapshot                  |
| `/api/v1/realtime`                     | Authenticated, same-origin read-only SSE stream               |
| `/reports`                             | Filtered Network Health Report and authenticated CSV export   |
| `/api/v1/reports/network-health`       | Bounded authenticated report contract                         |
| `/api/v1/reports/alerts.csv`           | Authenticated bounded Alerts CSV                              |
| `/settings`                            | Global settings and Administrator AlertRule controls          |
| `/api/v1/settings`                     | Authenticated read; Administrator update                      |
| `/api/v1/alert-rules`                  | Existing AlertRule list                                       |
| `/api/v1/alert-rules/{id}`             | Administrator-only bounded AlertRule update                   |
| `/api/v1/topology/positions`           | Administrator-only saved node positions                       |
| `/api/health/live`, `/ready`           | Minimal public liveness and database-backed readiness         |

`proxy.ts` performs only an optimistic cookie-presence redirect. Every protected
server render verifies the signature and expiry, and protected application use
cases assert permissions. The stateless cookie cannot be individually revoked
server-side before expiry; see ADR-0002.

The runtime Dashboard reads deterministic persisted Demo data while retaining the
Sprint 1 fixture adapter for isolated tests. The score intentionally omits
unresolved packet-loss, ping, and degraded-ratio deductions and labels that
formula incomplete.

The Device module persists deterministic Demo inventory and 24 hourly metric
fixtures. Administrator can create, update, and confirm a soft archive. Network
Engineer and Viewer are read-only. Archives never hard-delete devices, metrics, or
audit history. Sprint 6 adds bounded historical ranges and an accessible Metric
table; it does not interpolate values or add interactive history charts.

Sprint 3 persists Alert rules, Alerts, and Events. Accepted metric batches can be
evaluated synchronously through an internal application service; no scheduler,
worker, simulation, polling, WebSocket, or SSE transport invokes it yet. Alert
lifecycle changes write the Alert, Event, and AuditLog atomically. Events have no
mutation API and permanent Demo retention. The bandwidth rule is disabled until
link capacity exists.

Sprint 4 persists canonical, visually undirected network connections and renders
only active Devices and their links. `parentDeviceId` remains independent
metadata. The topology uses deterministic client layout, provides keyboard
controls and a complete accessible list, and exposes no connection mutations or
saved coordinates. Native SSE supplies cache-invalidation signals to Topology,
Alerts, Events, and the shell indicator; REST remains authoritative and
five-second polling runs only while SSE is unavailable. The process-local
publisher is Demo-only, non-durable, and not suitable for multi-instance
production deployment.

Sprint 6 adds one bounded Network Health Report and an Alerts CSV for all
authenticated roles, global presentation settings, bounded updates to existing AlertRules,
and Administrator-saved topology positions. Shared filters live in validated URL
parameters. AR-BW-01 remains disabled. PDF output, user management, Demo reset,
Alert recurrence, and automatic resolution remain absent.

Sprint 7 adds a one-Web/one-Worker Render Blueprint, paid PostgreSQL definition,
environment validation, Viewer-only public production identity policy, health
checks, redacted structured logs, guarded empty-only bootstrap, CI validation,
restore verification, and release runbooks. Automatic deployment is disabled.
No live deployment or release tag is created here.

For a separate public portfolio preview with no paid Render resource, use
`render.portfolio.yaml` and
[`docs/PORTFOLIO_DEPLOYMENT.md`](docs/PORTFOLIO_DEPLOYMENT.md). That mode uses
one Render Free Web Service plus an external Neon Free database, exposes only
Viewer login, and has no persistent simulation Worker. It is explicitly not the
production-grade architecture.

## Repository structure

```text
app/             Next.js routes and layouts
components/      Shared presentation components
modules/         Logical product modules using layered boundaries
lib/             Framework-neutral shared helpers
prisma/          PostgreSQL schema, additive migrations, and deterministic seed
tests/           Cross-module integration and end-to-end tests
docs/            Baseline copies, roadmap, traceability, decisions, and reports
scripts/         Documented maintenance and simulation scripts when implemented
```

## Documentation

- [Approved product scope](docs/PRODUCT_SCOPE.md)
- [Implementation assumptions and conflicts](docs/IMPLEMENTATION_ASSUMPTIONS.md)
- [Implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
- [Requirements tracker](docs/REQUIREMENTS_TRACKER.md)
- [Architecture decisions](docs/adr/0001-project-foundation.md)
- [Demo identity and Dashboard decision](docs/adr/0002-demo-identity-and-dashboard-contracts.md)
- [PostgreSQL Device persistence decision](docs/adr/0003-postgresql-device-persistence.md)
- [Alert lifecycle and Event contract decision](docs/adr/0004-alert-lifecycle-and-event-contracts.md)
- [Topology and realtime decision](docs/adr/0005-topology-and-realtime-architecture.md)
- [Simulation architecture decision](docs/adr/0006-simulation-runtime-and-scenarios.md)
- [Reports, settings, filters, and positions decision](docs/adr/0007-reports-settings-filters-and-topology-positions.md)
- [Render release-readiness decision](docs/adr/0008-render-deployment-release-readiness-and-v1-boundary.md)
- [Deployment runbook](docs/DEPLOYMENT.md)
- [Free portfolio deployment](docs/PORTFOLIO_DEPLOYMENT.md)
- [Backup and restore runbook](docs/BACKUP_RESTORE.md)
- [REST API reference](docs/API.md)
- [Security and realtime limitations](docs/SECURITY.md)
- [Testing and database-safety guide](docs/TESTING.md)
- [Sprint 0 completion report](docs/SPRINT_0_COMPLETION_REPORT.md)
- [Sprint 1 completion report](docs/SPRINT_1_COMPLETION_REPORT.md)
- [Sprint 2 completion report](docs/SPRINT_2_COMPLETION_REPORT.md)
- [Sprint 3 completion report](docs/SPRINT_3_COMPLETION_REPORT.md)
- [Sprint 4 completion report](docs/SPRINT_4_COMPLETION_REPORT.md)
- [Sprint 5 completion report](docs/SPRINT_5_COMPLETION_REPORT.md)
- [Sprint 6 completion report](docs/SPRINT_6_COMPLETION_REPORT.md)
- [Sprint 7 completion report](docs/SPRINT_7_COMPLETION_REPORT.md)
- [Approved baseline package](docs/baseline/README_AR.txt)

The source documents in `docs/baseline/` are authoritative. Changes to scope require
the approved Change Request process described in DOC-000 and DOC-001.
