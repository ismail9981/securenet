# SecureNet

SecureNet is a simulated Network Monitoring Center for understanding network health,
device state, alerts, operational events, and topology from one interface. Version
1.0 is a portfolio/demo product: it does **not** monitor a real network, discover
devices, or connect through SNMP, WMI, SSH, or agents.

This repository contains the validated Sprint 0–2 implementation: the application
foundation, Demo identity and Dashboard, and PostgreSQL-backed Device Inventory.
Authentication and every Dashboard value remain deliberately demonstration-only;
they must not protect or represent a real monitored network.

## Approved stack

- Next.js App Router and React with strict TypeScript
- Tailwind CSS with project-owned design tokens and shadcn/ui planned component
  conventions
- Modular monolith with domain, application, infrastructure, and presentation
  boundaries
- Zod for boundary schemas and shared type inference
- bcrypt password verification and JOSE-signed HttpOnly Demo sessions
- Recharts for the deterministic accessible Dashboard trend
- PostgreSQL 17 with Prisma for device, location, metric, and audit persistence
- Vitest/Testing Library for unit, integration, and component tests; Playwright and
  axe-core for browser and accessibility tests
- TanStack Query, React Flow, production identity, and realtime adapters remain
  deferred until an approved sprint uses them

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

`DATABASE_URL` must target the development database. `TEST_DATABASE_URL` must
target exactly `securenet_test`; the reset command refuses every other database:

```bash
npm run db:test:reset
```

Open [http://localhost:3000](http://localhost:3000). The root route resolves through
the protected Dashboard flow and redirects unauthenticated users to `/login`.

The login screen presents deterministic fictional accounts for Administrator,
Network Engineer, and Viewer. Their credentials are public by design so the RBAC
matrix is repeatable. All three accounts use the local Demo password
`SecureNetDemo123`, configured through `SEED_DEMO_PASSWORD`. Do not reuse that
password or this adapter for real data.

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

| Route                                  | Status                                                    |
| -------------------------------------- | --------------------------------------------------------- |
| `/login`                               | Demo-only deterministic account login                     |
| `/dashboard`                           | Protected deterministic Sprint 1 Dashboard                |
| `/devices`, `/devices/[id]`            | Persisted Device List and Device Details                  |
| `/api/v1/auth/login`, `/logout`, `/me` | Demo identity/session API                                 |
| `/api/v1/devices`                      | List/search/filter/sort/page and Administrator create     |
| `/api/v1/devices/{id}`                 | Details, Administrator update, and confirmed soft archive |
| `/api/v1/devices/{id}/metrics`         | Persisted metric history API; latest snapshot rendered    |
| `/alerts`, `/events`                   | Protected placeholders for Sprint 3                       |
| `/topology`                            | Protected placeholder for Sprint 4                        |

`proxy.ts` performs only an optimistic cookie-presence redirect. Every protected
server render verifies the signature and expiry, and protected application use
cases assert permissions. The stateless cookie cannot be individually revoked
server-side before expiry; see ADR-0002.

The Dashboard's counts, Health Score inputs, trend, alerts, events, and timestamp
are fixed fixtures. The score intentionally omits unresolved packet-loss, ping, and
degraded-ratio deductions and labels that formula incomplete.

The Device module persists deterministic Demo inventory and 24 hourly metric
fixtures. Administrator can create, update, and confirm a soft archive. Network
Engineer and Viewer are read-only. Archives never hard-delete devices, metrics, or
audit history. The UI deliberately shows only the current metric snapshot;
historical charts, alert/event data, realtime updates, and topology behavior remain
outside Sprint 2.

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
- [Sprint 0 completion report](docs/SPRINT_0_COMPLETION_REPORT.md)
- [Sprint 1 completion report](docs/SPRINT_1_COMPLETION_REPORT.md)
- [Sprint 2 completion report](docs/SPRINT_2_COMPLETION_REPORT.md)
- [Approved baseline package](docs/baseline/README_AR.txt)

The source documents in `docs/baseline/` are authoritative. Changes to scope require
the approved Change Request process described in DOC-000 and DOC-001.
