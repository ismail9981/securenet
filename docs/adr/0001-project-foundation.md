# ADR-0001: Project foundation decisions

- Status: Accepted for Sprint 0
- Date: 2026-07-24
- Sources: DOC-001, DOC-003, DOC-004, DOC-007, DOC-008, DOC-009, DOC-010

## Context

SecureNet needs a maintainable single-developer foundation that supports later
server-side authorization, PostgreSQL persistence, deterministic domain rules,
realtime updates, and a responsive operational interface without prematurely
implementing those capabilities.

## Decisions

### Application framework

Use Next.js App Router with React and strict TypeScript. Server Components remain
the default; Client Components are limited to genuine interaction boundaries.

### Repository structure

Use the DOC-004 top-level structure (`app`, `components`, `modules`, `lib`,
`prisma`, `tests`, `docs`, `scripts`). Logical product modules live under
`modules/` and use DOC-008’s `domain → application → infrastructure/presentation`
dependency direction. Domain code may not depend on Next.js, React, or Prisma.

### Styling system

Use Tailwind CSS with project-owned CSS design tokens and shadcn/ui-compatible
source primitives. The default is a restrained dark operations interface with an
8-point rhythm, 8–12 px radii, Lucide icons, fixed semantic status colors,
visible focus, reduced-motion handling, and layouts usable from 320 px.

### State management

Keep local interaction state in React. Do not add a global client state store.
Server state will use TanStack Query only where caching, refetching, realtime cache
updates, or client interaction justify it. URL state will hold shareable filters.

### Data fetching

Server Components call application use cases directly for initial reads.
REST/JSON `/api/v1` remains the full external/client contract and source of truth.
TanStack Query will consume REST contracts for interactive client views. Zod
validates data at boundaries.

### Testing

Use TypeScript, ESLint, and Prettier as static gates; Vitest for pure domain,
application, integration, and component tests; Testing Library when interactive
components exist; and Playwright for critical desktop/mobile journeys. Keep tests
close to pure source when practical and cross-module/E2E tests under `tests/`.

### Environment configuration

Document approved variable names in `.env.example`, keep all real `.env*` files out
of Git, never put secrets in `NEXT_PUBLIC_*`, and separate Development, Preview,
Staging, and Production Demo values. Sprint 0 does not read future secrets.

### Future realtime communication

Use compact documented domain events; REST snapshots remain authoritative. Clients
must reconnect and fetch a fresh snapshot after interruption, with polling as a
fallback. Transport/provider selection is deferred until deployment constraints are
tested; no WebSocket, Socket.IO, SSE, or managed provider dependency is installed
in Sprint 0.

## Consequences

- The foundation has no unused production data, chart, topology, auth, ORM, or
  realtime dependencies.
- Module boundaries are documented before product logic is introduced.
- Later sprints must add focused ADRs for authentication, persistence, and realtime
  provider selection.
- The DOC-001/DOC-003 alert status conflict must be resolved before database/API
  contracts are frozen.
