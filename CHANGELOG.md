# Changelog

All notable changes to SecureNet are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project intends to
use semantic versioning once releases begin.

## [Unreleased]

### Sprint 6

- Added the bounded Network Health Report, shared validated URL filters, and
  Administrator-only Alerts CSV export with spreadsheet-formula neutralization.
- Added global presentation settings and bounded Administrator AlertRule
  management while keeping AR-BW-01 disabled.
- Added five historical Metric ranges with server-side aggregation and an
  accessible Device Details history table.
- Added transactional Administrator-saved topology positions with deterministic
  fallback layout for unsaved nodes.
- Added additive SystemSetting/TopologyPosition persistence, approved audit
  actions, responsive role-aware UI, and Sprint 6 unit/integration/browser,
  accessibility, security, and performance coverage.
- Kept automatic Alert resolution, recurrence, Demo reset, user management,
  incident overlays, PDF output, deployment, v1.0 release, and Sprint 7 absent.

### Sprint 5

- Added deterministic 60-second baseline generation and six approved
  incident/recovery scenarios with five-second execution cycles.
- Added additive SimulationRun, Metric source, and Metric/Event run traceability
  without deleting existing history.
- Added a PostgreSQL advisory-locked Node worker, restart recovery, target locks,
  idempotent batches, and a compact `LISTEN/NOTIFY` bridge to existing SSE.
- Added Administrator-only simulation run/status/cancel APIs and accessible,
  responsive Dashboard controls.
- Switched the runtime Dashboard to persisted Device, Metric, Alert, and Event
  data while retaining the fixture adapter and incomplete Health Score
  disclosure.
- Kept AR-BW-01 disabled and Alert auto-resolution absent. Reset, pause, resume,
  speed, overlays, purge jobs, Reports, Settings, and Sprint 6 remain deferred.

### Fixed

- Corrected same-origin mutation checks for equivalent `localhost` and
  `127.0.0.1` loopback hosts on the same port while retaining cross-origin denial.
- Unified all three public Demo accounts on the documented
  `SEED_DEMO_PASSWORD`, with matching bcrypt cost-12 repository hashes and
  consistent login instructions.
- Removed the redundant focusable Recharts accessibility layer from the decorative
  traffic SVG; the equivalent textual traffic summary remains available to
  assistive technology.
- Pinned the patched `minimatch` transitive version used by ESLint tooling,
  clearing the current high-severity denial-of-service advisory chain.

### Added

- Additive Sprint 4 `NetworkConnection` persistence with canonical undirected
  endpoints, restrictive history relationships, nullable capacity metadata, and
  deterministic idempotent seed links.
- Authorized active Topology snapshot API, deterministic React Flow layout,
  interactive controls, status-aware nodes, Device navigation, and complete
  accessible-list alternative across desktop and 320-pixel mobile.
- Same-origin authenticated SSE endpoint, versioned bounded envelopes,
  process-local publisher limits, heartbeat/lifetime handling, reconnect snapshot
  recovery, and conditional five-second polling.
- After-commit Device, Alert, and Event publication with non-rollback failure
  handling, live Topology/Alerts/Event consumers, and the shell connection-state
  indicator.
- Sprint 4 domain, database, route, component, realtime, desktop/mobile,
  accessibility, security, recovery, and regression coverage.
- ADR-0005 plus Sprint 4 API, testing, security, assumptions, roadmap,
  traceability, and completion documentation.
- Additive Sprint 3 AlertRule, Alert, and Event migration with fixed enums,
  restrictive history relationships, consecutive-sample rules, and a partial
  unique active-Alert constraint.
- Deterministic idempotent Sprint 3 rules, Alerts, and Events; bandwidth
  evaluation is explicitly disabled until link capacity exists.
- Pure threshold/duration/consecutive evaluation, synchronous accepted-batch
  service, active deduplication/retrigger behavior, and the four-state Alert
  lifecycle.
- Transactional Alert lifecycle Event/AuditLog recording and prospective
  device-create/update/archive/status Events with permanent Demo retention.
- Validated Alert/Event REST APIs, related-device endpoints, responsive Alerts
  and Events pages, role-aware lifecycle controls, archived history treatment,
  and Device Details integration.
- Sprint 3 unit, database, route, component, desktop/mobile, accessibility,
  security, concurrency, rollback, retention, and regression coverage.
- ADR-0004 and Sprint 3 assumptions, API, testing, traceability, and completion
  documentation.
- PostgreSQL/Prisma models and an additive migration for Demo audit users,
  locations, devices, nullable parent relationships, 24-hour metrics, and
  append-only audit logs.
- Deterministic idempotent seed data with 3 users, 3 locations, 30 active devices,
  and 720 metric snapshots, plus a reset command that refuses any target other
  than `securenet_test`.
- Layered Device repository/application boundaries and documented REST endpoints
  for safe queries, details, metrics, Administrator mutations, exact uniqueness
  conflicts, and confirmed soft archive.
- Responsive Device List and Device Details experiences with search, filters,
  sorting, pagination, current metrics, all documented states, and explicit
  unavailable-data disclosures.
- Administrator create/update/archive workflows with transactional actor audit
  context; Network Engineer and Viewer remain read-only in UI and server use cases.
- Sprint 2 unit, PostgreSQL integration, route, component, desktop/mobile E2E,
  accessibility, security, build, audit, and HTTP smoke coverage.
- ADR-0003, Sprint 2 completion evidence, and updated assumptions, roadmap,
  traceability, environment, repository, and database documentation.
- Approved Sprint 2 sequencing for Administrator-only device create, update, and
  soft archive, with PostgreSQL audit context and persisted metric-history
  groundwork while historical UI remains deferred.
- Sprint 1 server-only Demo identity adapter with deterministic Administrator,
  Network Engineer, and Viewer accounts.
- bcrypt password verification, JOSE-signed HttpOnly sessions, bounded login
  validation, generic failure responses, Demo rate limiting, and redacted
  structured authentication logs.
- Exact `/api/v1/auth/login`, `/logout`, and `/me` routes with authoritative
  server verification and application-level permission assertions.
- Deterministic Dashboard KPIs, device distribution, traffic trend, linked fixture
  alerts/events, loading/error/empty states, and explicit simulation disclosures.
- Documented Network Health Score boundaries and fixed deductions, with unresolved
  formula factors surfaced rather than inferred.
- Identity/domain/application/integration/component/browser/accessibility test
  coverage and security response headers.
- ADR-0002 and updated assumptions, roadmap, traceability, environment, and Sprint
  1 completion records.
- Sprint 0 Next.js, React, strict TypeScript, Tailwind CSS, ESLint, and Prettier
  foundation.
- Responsive application shell with desktop navigation and mobile drawer.
- Clearly labeled placeholders for the DOC-001 P0 route set.
- Shared loading, error, not-found, and empty-state foundations.
- Dark operational design tokens, focus treatment, and reduced-motion support.
- Core documented network enums and Zod schemas.
- Vitest unit-test and Playwright end-to-end foundations.
- Environment template, Git ignore rules, development scripts, baseline document
  copies, requirements tracker, roadmap, ADR, and Sprint 0 report.

[Unreleased]: https://github.com/example/securenet/compare/HEAD...HEAD
