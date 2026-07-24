# SecureNet

SecureNet is a simulated Network Monitoring Center for understanding network health,
device state, alerts, operational events, and topology from one interface. Version
1.0 is a portfolio/demo product: it does **not** monitor a real network, discover
devices, or connect through SNMP, WMI, SSH, or agents.

This repository currently contains the validated **Sprint 0 project foundation**.
All product screens are clearly labeled placeholders; operational features have not
been implemented.

## Approved stack

- Next.js App Router and React with strict TypeScript
- Tailwind CSS with project-owned design tokens and shadcn/ui planned component
  conventions
- Modular monolith with domain, application, infrastructure, and presentation
  boundaries
- Zod for boundary schemas and shared type inference
- Vitest for unit/integration tests and Playwright for end-to-end tests
- PostgreSQL, Prisma, TanStack Query, Recharts, React Flow, authentication, and
  realtime adapters are approved for later sprints but are intentionally not
  installed until used

## Requirements

- Node.js 22 or newer (Node.js 24 LTS is used for Sprint 0 validation)
- npm 11 or newer

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to
`/dashboard`.

Sprint 0 does not read environment variables at runtime. The blank future variables
in `.env.example` document the approved names without supplying secrets.

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

## Foundation routes

| Route           | Sprint 0 status        |
| --------------- | ---------------------- |
| `/dashboard`    | P0 placeholder         |
| `/devices`      | P0 placeholder         |
| `/devices/[id]` | P0 dynamic placeholder |
| `/alerts`       | P0 placeholder         |
| `/events`       | P0 placeholder         |
| `/topology`     | P0 placeholder         |

`/login` is not scaffolded because DOC-001 classifies Login as P1. The conflicting
P0 classification in DOC-002 and DOC-014 is recorded in
[implementation assumptions](docs/IMPLEMENTATION_ASSUMPTIONS.md).

## Repository structure

```text
app/             Next.js routes and layouts
components/      Shared presentation components
modules/         Logical product modules using layered boundaries
lib/             Framework-neutral shared helpers
prisma/          Reserved database boundary; schema begins in its planned sprint
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
- [Sprint 0 completion report](docs/SPRINT_0_COMPLETION_REPORT.md)
- [Approved baseline package](docs/baseline/README_AR.txt)

The source documents in `docs/baseline/` are authoritative. Changes to scope require
the approved Change Request process described in DOC-000 and DOC-001.
