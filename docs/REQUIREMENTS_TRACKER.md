# Requirements implementation tracker

Updated: 2026-07-29

Baseline: SecureNet Full Documentation Baseline v1.0

Status vocabulary follows DOC-014: `Not Started`, `In Progress`, `Implemented`,
`Verified`, `Deferred`, or `Rejected`. A Sprint 0 placeholder makes a route
`In Progress`; it does not satisfy the product requirement.

## DOC-001 P0 functional requirements

| Requirement ID | Requirement title                          | Priority  | Source document | Planned phase | Current status | Related files                                  | Related tests                                 |
| -------------- | ------------------------------------------ | --------- | --------------- | ------------- | -------------- | ---------------------------------------------- | --------------------------------------------- |
| FR-001         | Device/alert totals and network health     | P0        | DOC-001 §11     | Sprint 1      | Verified       | Dashboard plus deterministic repository        | Contract/component/E2E tests                  |
| FR-002         | Traffic and resource charts by time range  | P0        | DOC-001 §11     | Sprint 1      | In Progress    | Fixed 24-hour Demo traffic trend               | Component/E2E tests; selector later           |
| FR-003         | Searchable/filterable/sortable devices     | P0        | DOC-001 §11     | Sprint 2      | Verified       | Device API and responsive inventory UI         | Query/route/component/E2E tests               |
| FR-004         | Open device details from every reference   | P0        | DOC-001 §11     | Sprint 2      | In Progress    | Inventory references link to details           | Device navigation E2E; later modules          |
| FR-005         | Latest and historical device metrics       | P0        | DOC-001 §11     | Sprint 2/6    | Verified       | Bounded range API and accessible history UI    | Repository/route/component/E2E tests          |
| FR-006         | Simulation-driven automatic device state   | P0        | DOC-001 §11     | Sprint 5      | Verified       | Deterministic worker, Metrics, state/events    | Domain/database/worker/E2E tests              |
| FR-007         | Threshold-based alert creation             | P0        | DOC-001 §11     | Sprint 3      | In Progress    | Supported rules evaluate; bandwidth off        | Boundary/database/concurrency tests           |
| FR-008         | Open-alert deduplication                   | P0        | DOC-001 §11     | Sprint 3      | Verified       | Partial unique index plus retrigger path       | Dedupe/concurrency integration tests          |
| FR-009         | Audited acknowledge and resolve            | P0        | DOC-001 §11     | Sprint 3      | Verified       | Transactional lifecycle service and UI         | State/RBAC/rollback/route/E2E tests           |
| FR-010         | Important changes written to Event Log     | P0        | DOC-001 §11     | Sprint 3      | Verified       | Fixed Event taxonomy and read-only UI          | Repository/route/filter/E2E tests             |
| FR-011         | Status-aware network topology              | P0        | DOC-001 §11     | Sprint 4      | Verified       | Persisted active graph and accessible UI       | Domain/repository/component/E2E               |
| FR-012         | Run a manual incident scenario             | P1 pulled | DOC-001 §11     | Sprint 5      | Verified       | Admin Dashboard run/status/cancel control      | API/component/desktop/mobile E2E              |
| FR-013         | Automatic Network Health Score             | P0        | DOC-001 §11     | Sprint 1      | In Progress    | Partial documented formula and disclosure      | Health Score unit/component tests             |
| FR-014         | Login and role enforcement                 | P1        | DOC-001 §11     | Sprint 1/6    | Verified       | Server RBAC and role-aware operations UX       | Permission/route/desktop/mobile tests         |
| FR-015         | Shared time/device/severity/status filters | P1        | DOC-001 §11     | Sprint 6      | Verified       | Validated URL-backed report/operations filters | Domain/route/E2E tests                        |
| FR-016         | Safe Demo data reset                       | P1        | DOC-001 §11     | Deferred      | Deferred       | Product reset intentionally absent             | Test-only reset guard is not product evidence |
| FR-017         | Printable summary report                   | P2        | DOC-001 §11     | Deferred      | Deferred       | No printable/PDF implementation                | Not implemented                               |

## DOC-002 P0 product requirements

| Requirement ID | Requirement title                            | Priority    | Source document | Planned phase | Current status | Related files                                  | Related tests                        |
| -------------- | -------------------------------------------- | ----------- | --------------- | ------------- | -------------- | ---------------------------------------------- | ------------------------------------ |
| PRD-AUTH-001   | Email/password sign in                       | P0 conflict | DOC-002 §8.1    | Sprint 1      | Verified       | Identity module and login API                  | Auth unit/integration/E2E tests      |
| PRD-AUTH-002   | Clearly presented Demo account               | P0 conflict | DOC-002 §8.1    | Sprint 1      | Verified       | Three deterministic RBAC accounts              | Login component and E2E tests        |
| PRD-AUTH-003   | Generic failed-login message                 | P0 conflict | DOC-002 §8.1    | Sprint 1      | Verified       | Login API and form                             | Auth integration and E2E tests       |
| PRD-DASH-001   | Device and critical-alert totals             | P0          | DOC-002 §8.2    | Sprint 1      | Verified       | Typed deterministic Dashboard                  | Contract/component/E2E tests         |
| PRD-DASH-002   | Health Score and classification              | P0          | DOC-002 §8.2    | Sprint 1      | In Progress    | Boundaries/fixed deductions only               | Health Score unit/component tests    |
| PRD-DASH-003   | Bandwidth trend                              | P0          | DOC-002 §8.2    | Sprint 1      | Verified       | Deterministic Recharts trend                   | Dashboard component/E2E tests        |
| PRD-DASH-004   | Linked latest alerts and events              | P0          | DOC-002 §8.2    | Sprint 1      | Verified       | Fixture lists linked to protected routes       | Dashboard E2E test                   |
| PRD-DASH-005   | Update without page reload                   | P0          | DOC-002 §8.2    | Sprint 4/5    | Verified       | Persisted Dashboard plus committed SSE refresh | Realtime/worker/E2E tests            |
| PRD-DASH-006   | Run authorized simulation scenario           | P1 pulled   | DOC-002 §8.2    | Sprint 5      | Verified       | Administrator-only allow-listed controls       | RBAC/API/component/E2E tests         |
| PRD-DEV-001    | Device table with status and metrics         | P0          | DOC-002 §8.3    | Sprint 2      | Verified       | PostgreSQL-backed responsive inventory         | Repository/component/E2E tests       |
| PRD-DEV-002    | Search name/hostname/IP                      | P0          | DOC-002 §8.3    | Sprint 2      | Verified       | Validated query DTO and Device List            | Domain/route/E2E tests               |
| PRD-DEV-003    | Filter type/status/location                  | P0          | DOC-002 §8.3    | Sprint 2      | Verified       | Validated API/UI filters                       | Query/route/E2E tests                |
| PRD-DEV-004    | Sort and paginate devices                    | P0          | DOC-002 §8.3    | Sprint 2      | Verified       | Stable sorting and bounded pagination          | Repository/E2E tests                 |
| PRD-DEV-005    | Administrator device management              | P1 pulled   | DOC-002 §8.3    | Sprint 2      | Verified       | Admin create/update/soft-archive flows         | Service/route/E2E/audit tests        |
| PRD-DEV-006    | Unique active IP and hostname                | P0          | DOC-002 §8.3    | Sprint 2      | Verified       | Partial unique indexes and 409 mapping         | Repository/route conflict tests      |
| PRD-DD-001     | Device identity/location/OS/status/last seen | P0          | DOC-002 §8.4    | Sprint 2      | Verified       | Server-rendered Device Details                 | Repository/route/E2E tests           |
| PRD-DD-002     | Device metric summaries                      | P0          | DOC-002 §8.4    | Sprint 2      | Verified       | Current metric snapshot component              | Component/route/E2E tests            |
| PRD-DD-003     | Metric history by selected range             | P0          | DOC-002 §8.4    | Sprint 2/6    | Verified       | Five bounded ranges and accessible table       | Repository/route/component/E2E tests |
| PRD-DD-004     | Device alerts and events                     | P0          | DOC-002 §8.4    | Sprint 2/3    | Verified       | Related persisted Alert/Event sections         | Repository/route/E2E/axe tests       |
| PRD-DD-005     | Explain unavailable data                     | P0          | DOC-002 §8.4    | Sprint 2      | Verified       | Null/stale/unavailable UI states               | Component/E2E/axe tests              |
| PRD-ALT-001    | Filter alerts by severity/status/device/time | P0          | DOC-002 §8.5    | Sprint 3      | Verified       | Validated API and responsive filter UI         | Query/route/E2E tests                |
| PRD-ALT-002    | Acknowledge with actor and time              | P0          | DOC-002 §8.5    | Sprint 3      | Verified       | Transactional lifecycle command                | Actor/note/RBAC/route tests          |
| PRD-ALT-003    | Resolve with optional note                   | P0          | DOC-002 §8.5    | Sprint 3      | Verified       | Condition/role-aware resolve command           | State/rollback/smoke tests           |
| PRD-ALT-004    | Prevent duplicate open alerts                | P0          | DOC-002 §8.5    | Sprint 3      | Verified       | Database active-device/rule constraint         | Concurrent evaluation test           |
| PRD-ALT-005    | Reopen resolved alert on recurrence          | P1          | DOC-002 §8.5    | Deferred      | Deferred       | Existing deduplication only                    | No recurrence implementation         |
| PRD-EVT-001    | Record state/alert/admin events              | P0          | DOC-002 §8.6    | Sprint 3      | Verified       | Prospective Alert/device Event writes          | Transaction/repository tests         |
| PRD-EVT-002    | Search/filter/browse event timeline          | P0          | DOC-002 §8.6    | Sprint 3      | Verified       | Validated cursor API and timeline UI           | Cursor/filter/search/E2E tests       |
| PRD-EVT-003    | Event records immutable in UI                | P0          | DOC-002 §8.6    | Sprint 3      | Verified       | Read-only service/API/UI boundary              | RBAC/route/E2E source review         |
| PRD-TOP-001    | Display topology nodes/links/types           | P0          | DOC-002 §8.7    | Sprint 4      | Verified       | React Flow plus complete text alternative      | Snapshot/component/E2E tests         |
| PRD-TOP-002    | Node status encoding                         | P0          | DOC-002 §8.7    | Sprint 4      | Verified       | Text, shape, legend, and status styling        | Component/axe/E2E tests              |
| PRD-TOP-003    | Open device summary from node                | P0          | DOC-002 §8.7    | Sprint 4      | Verified       | Node summary and Device Details link           | Component/desktop/mobile E2E         |
| PRD-TOP-004    | Incident impact on related nodes             | P1          | DOC-002 §8.7    | Deferred      | Deferred       | Incident overlay intentionally absent          | Not implemented                      |
| PRD-TOP-005    | Save Administrator node positions            | P1          | DOC-002 §8.7    | Sprint 6      | Verified       | Partial transactional saved positions          | Repository/route/component/E2E tests |
| PRD-REP-001    | Health/devices/alerts report by period       | P1          | DOC-002 §8.8    | Sprint 6      | Verified       | Bounded Network Health Report                  | Domain/repository/route/E2E tests    |
| PRD-REP-002    | Export tabular data as CSV                   | P1          | DOC-002 §8.8    | Sprint 6      | Verified       | Bounded Alerts CSV with formula neutralization | Route/security/E2E tests             |
| PRD-SET-001    | Administrator alert threshold management     | P1          | DOC-002 §8.8    | Sprint 6      | Verified       | Bounded updates to existing AlertRules         | Domain/repository/route/E2E tests    |
| PRD-SET-002    | Display timezone and measurement units       | P1          | DOC-002 §8.8    | Sprint 6      | Verified       | Global presentation-only SystemSetting         | Domain/repository/route/E2E tests    |

## DOC-003 P0 software requirements

| Requirement ID | Requirement title                              | Priority | Source document | Planned phase | Current status | Related files                                    | Related tests                  |
| -------------- | ---------------------------------------------- | -------- | --------------- | ------------- | -------------- | ------------------------------------------------ | ------------------------------ |
| SRS-FR-001     | Authenticate protected routes                  | P0       | DOC-003 §4      | Sprint 1      | Verified       | Server session guard and auth routes             | Auth integration/E2E tests     |
| SRS-FR-002     | Enforce authorization on server                | P0       | DOC-003 §4      | Sprint 1      | In Progress    | Server guards plus device use-case authorization | RBAC/service/route/E2E tests   |
| SRS-FR-003     | Immutable device identifier                    | P0       | DOC-003 §4      | Sprint 2      | Verified       | Database UUID and read-only public contract      | Schema/repository/route tests  |
| SRS-FR-004     | Metric source and received times               | P0       | DOC-003 §4      | Sprint 2      | Verified       | Append-only metric timestamps                    | Seed/repository/route tests    |
| SRS-FR-005     | Determine stale data by configuration          | P0       | DOC-003 §4      | Sprint 2      | Verified       | Pure configurable freshness rule                 | Freshness unit/component tests |
| SRS-FR-006     | Evaluate alert rules after metric batch        | P0       | DOC-003 §4      | Sprint 3      | Verified       | Synchronous accepted-batch application service   | Rule/dedupe/concurrency tests  |
| SRS-FR-007     | Event for every important transition           | P0       | DOC-003 §4      | Sprint 3      | Verified       | Transactional Alert and device Event emission    | Integration/route tests        |
| SRS-FR-008     | Realtime client updates                        | P0       | DOC-003 §4      | Sprint 4      | Verified       | SSE signals plus REST recovery/polling           | Route/component/live E2E tests |
| SRS-FR-009     | Safe pagination and filters                    | P0       | DOC-003 §4      | Sprint 2/3    | Verified       | Bounded Device/Alert/Event query contracts       | Domain/route/E2E tests         |
| SRS-FR-010     | No permanent operational-record deletion in UI | P0       | DOC-003 §4      | Sprint 3      | Verified       | Soft archive and immutable history boundaries    | Retention/route/E2E tests      |
| SRS-FR-011     | Start, stop, and safely reset simulation       | P1       | DOC-003 §4      | Sprint 5/6    | In Progress    | Start/status/cancel verified; reset deferred     | Lifecycle/API/E2E; reset later |
| SRS-FR-012     | Actor identity on administrative actions       | P0       | DOC-003 §4      | Sprint 1/3    | Verified       | Stable actor IDs on lifecycle/Event/Audit rows   | Actor/transaction tests        |

## Release quality requirements

These baseline NFRs do not carry P0/P1/P2 values in their source tables. They are
treated as release-wide gates rather than silently assigning a priority.

| Requirement ID | Requirement title                           | Priority     | Source document | Planned phase        | Current status | Related files                                | Related tests                        |
| -------------- | ------------------------------------------- | ------------ | --------------- | -------------------- | -------------- | -------------------------------------------- | ------------------------------------ |
| NFR-001        | Dashboard load under 3 seconds              | Release gate | DOC-001 §12     | Sprint 7             | Not Started    | Planned performance budget                   | Lighthouse planned                   |
| NFR-002        | Simulation changes visible within 5 seconds | Release gate | DOC-001 §12     | Sprint 4/5           | Verified       | Five-second worker plus committed SSE bridge | Worker/realtime/E2E timing           |
| NFR-003        | Current Chrome/Safari/Edge                  | Release gate | DOC-001 §12     | Sprint 7             | In Progress    | Standards-based foundation                   | Browser matrix planned               |
| NFR-004        | Responsive from 320 px                      | Release gate | DOC-001 §12     | Every sprint         | In Progress    | App shell and CSS                            | Foundation Playwright mobile         |
| NFR-005        | Maintainable modules and names              | Release gate | DOC-001 §12     | Every sprint         | In Progress    | `modules/README.md`, ADR                     | Static review                        |
| NFR-006        | Input, route, and secret protection         | Release gate | DOC-001 §12     | Sprint 1–7           | In Progress    | Auth validation/session/headers              | Auth/security checks                 |
| NFR-007        | Keyboard, contrast, headings, labels        | Release gate | DOC-001 §12     | Every sprint         | In Progress    | Shell/shared states/CSS                      | Accessibility E2E planned            |
| NFR-008        | Survive missing metric/request failure      | Release gate | DOC-001 §12     | Every feature sprint | In Progress    | Empty/error foundations                      | `TC-ERR-001` planned                 |
| NFR-009        | Auditable important operations/errors       | Release gate | DOC-001 §12     | Sprint 1–3           | In Progress    | Redacted structured auth events              | Full audit integration Sprint 3      |
| NFR-010        | Clearly identify simulation                 | Release gate | DOC-001 §12     | Every sprint         | In Progress    | `DemoDataBadge`, metadata                    | Foundation E2E                       |
| SRS-NFR-001    | Typical read P95 under 500 ms               | Release gate | DOC-003 §9      | Sprint 7             | Not Started    | Planned API performance checks               | Load test planned                    |
| SRS-NFR-002    | Initial load under 3 seconds                | Release gate | DOC-003 §9      | Sprint 7             | Not Started    | Planned performance budget                   | Lighthouse planned                   |
| SRS-NFR-003    | Demo targets 99% monthly availability       | Release gate | DOC-003 §9      | Sprint 7             | Not Started    | Planned deployment/monitoring                | Operations review                    |
| SRS-NFR-004    | HTTPS and externalized secrets              | Release gate | DOC-003 §9      | Sprint 7             | In Progress    | `.env.example`, `.gitignore`                 | Deployment/secret scan planned       |
| SRS-NFR-005    | Strong password hashing                     | Release gate | DOC-003 §9      | Sprint 1             | Verified       | bcrypt cost-12 Demo adapter                  | Auth unit/integration tests          |
| SRS-NFR-006    | Strict TypeScript and clean lint            | Release gate | DOC-003 §9      | Every sprint         | Verified       | `tsconfig.json`, ESLint config               | `npm run type-check`, `npm run lint` |
| SRS-NFR-007    | Keyboard and WCAG AA fundamentals           | Release gate | DOC-003 §9      | Every sprint         | In Progress    | Shell/shared states/CSS                      | Accessibility E2E planned            |
| SRS-NFR-008    | Operate from 320 px                         | Release gate | DOC-003 §9      | Every sprint         | In Progress    | Responsive shell                             | Foundation Playwright mobile         |
| SRS-NFR-009    | Structured critical logs                    | Release gate | DOC-003 §9      | Sprint 1/3           | In Progress    | Redacted JSON auth logger                    | Source/integration review            |
| SRS-NFR-010    | No real personal data in Demo               | Release gate | DOC-003 §9      | Every sprint         | In Progress    | Scope/content rules                          | Seed review planned                  |

## Sprint 0 delivery controls

| Control                                            | Status   | Evidence                                               |
| -------------------------------------------------- | -------- | ------------------------------------------------------ |
| Strict TypeScript configuration                    | Verified | `tsconfig.json`; type-check passed                     |
| Approved styling foundation and tokens             | Verified | `app/globals.css`; build and E2E passed                |
| Linting and formatting                             | Verified | ESLint/Prettier checks passed                          |
| Modular repository structure                       | Verified | ADR-0001, `modules/README.md`; lint/type-check passed  |
| P0 route placeholders only                         | Verified | Production route manifest and Playwright               |
| Loading, empty, error, not-found                   | Verified | Build plus shared state source review                  |
| Core documented enums/types                        | Verified | Three Vitest assertions passed                         |
| Unit and E2E test configuration                    | Verified | Vitest: 3 passed; Playwright: 4 passed                 |
| Environment and secret hygiene                     | Verified | Template/ignore review; `npm audit`: 0 vulnerabilities |
| Baseline, roadmap, tracker, ADR, changelog, README | Verified | Files present and format check passed                  |
| Format/lint/type/unit/build/local-run verification | Verified | `SPRINT_0_COMPLETION_REPORT.md`                        |

## Sprint 1 delivery controls

The complete Sprint 1 gate passed on 2026-07-25. Product requirements with
intentionally incomplete formulas or later use cases remain `In Progress`.

| Control                                              | Status   | Evidence                                                   |
| ---------------------------------------------------- | -------- | ---------------------------------------------------------- |
| Three deterministic Demo identities and bcrypt       | Verified | Identity adapter; 32 Vitest and 18 Playwright tests        |
| Signed HttpOnly session and exact auth routes        | Verified | Route integration, browser flows, and HTTP smoke           |
| Server-side authentication and permission primitives | Verified | Operations guard; Dashboard assertion; RBAC tests          |
| Typed deterministic Dashboard fixture                | Verified | Contract/component/browser tests and HTTP smoke            |
| Documented Health Score subset only                  | Verified | Domain/UI/browser tests; `formulaComplete: false`          |
| Dashboard desktop/mobile and automated accessibility | Verified | Playwright: 18 passed, including desktop/mobile axe checks |
| Security headers, bounded input, generic failures    | Verified | Route tests, HTTP smoke, security headers, audit: 0        |
| ADR, assumptions, roadmap, README, changelog, report | Verified | Documentation updated; format check passed                 |

## Sprint 2 delivery controls

The complete Sprint 2 gate passed on 2026-07-26. Cross-module requirements and
historical metric presentation remain `In Progress` where their full acceptance
scope belongs to later sprints.

| Control                                                | Status   | Evidence                                                  |
| ------------------------------------------------------ | -------- | --------------------------------------------------------- |
| PostgreSQL/Prisma schema, additive migration, seed     | Verified | Both DBs current; deterministic counts `3/3/30/720`       |
| Guarded test isolation and idempotent reset            | Verified | Dev target refused; two consecutive test resets passed    |
| Repository/application boundaries and REST routes      | Verified | 64 Vitest tests and production route manifest             |
| Device queries, details, current metric snapshot       | Verified | Route/component/desktop/mobile tests                      |
| Administrator create/update/confirmed soft archive     | Verified | Transaction/audit integration, E2E, and HTTP smoke        |
| Engineer and Viewer read-only enforcement              | Verified | Service/route/E2E/HTTP 403 evidence                       |
| Conflict handling and operational-history preservation | Verified | Exact 409 codes; metrics retained after archive           |
| Responsive behavior and automated accessibility        | Verified | Playwright: 36 passed, including desktop/mobile axe scans |
| Static, build, dependency, audit, and HTTP gates       | Verified | `validate`, `npm ls`, audit zero, route smoke passed      |
| ADR, assumptions, roadmap, README, changelog, report   | Verified | Sprint 2 documentation and traceability updated           |

## Sprint 4 delivery controls

The complete Sprint 4 gate passed on 2026-07-26. Dashboard value updates,
bandwidth evaluation, simulation, saved topology positions, and production
distributed realtime remain `In Progress`, `Not Started`, or deferred.

| Control                                                | Status   | Evidence                                                  |
| ------------------------------------------------------ | -------- | --------------------------------------------------------- |
| Additive NetworkConnection migration and constraints   | Verified | Both DBs current; self/reverse constraint tests passed    |
| Deterministic connection seed and guarded isolation    | Verified | Two counts `3/3/30/720/7/4/5/29/0`; dev reset refused     |
| Authorized active Topology snapshot and boundaries     | Verified | Repository, route, RBAC, DTO, archive/history tests       |
| React Flow graph and complete accessible alternative   | Verified | Component, keyboard, mobile, reduced-motion, axe tests    |
| Authenticated bounded same-origin SSE                  | Verified | Auth/origin/forgery/limit/heartbeat/message tests         |
| REST recovery and conditional polling                  | Verified | Component reconnect, duplicate, malformed, fallback tests |
| After-commit non-rollback publication                  | Verified | Device/Alert/Event integration and failure tests          |
| Live Topology, Alert, Event, and shell consumers       | Verified | Desktop/mobile committed-update E2E                       |
| Performance engineering budgets                        | Verified | 697 ms render; 16.7 ms interaction; 198.6 ms live update  |
| Static, build, dependency, security, audit, HTTP gates | Verified | 115 Vitest + 50 Playwright; audit/secret/smoke clean      |

## Sprint 5 delivery controls

The complete Sprint 5 gate passed on 2026-07-26. Reset, complete bandwidth
evaluation, and later operational modules remain `In Progress` or deferred.

| Control                                               | Status   | Evidence                                                    |
| ----------------------------------------------------- | -------- | ----------------------------------------------------------- |
| Additive SimulationRun and traceability migration     | Verified | Both DBs current; preservation/migration tests passed       |
| Deterministic six-scenario domain engine              | Verified | PRNG, replay, range, clamp, scenario, performance tests     |
| Five-second worker and 60-second Metric cadence       | Verified | Injected-clock runtime, persistence, and live E2E tests     |
| Advisory lock, overlap, idempotency, restart recovery | Verified | PostgreSQL repository/lock/concurrency tests                |
| Alert, Event, Audit, and failure boundaries           | Verified | Transaction, actor, dedupe, no-auto-resolve tests           |
| Administrator run/status/cancel API and controls      | Verified | Route, CSRF, RBAC, idempotency, component, E2E tests        |
| Persisted Dashboard and committed realtime bridge     | Verified | Dashboard repository, SSE role filter, live browser tests   |
| Mobile, keyboard, reduced motion, and accessibility   | Verified | 56-case desktop/mobile Playwright and axe suite             |
| Static, build, dependency, security, audit gates      | Verified | 145 Vitest + 56 Playwright; audit/secret/build checks clean |
| ADR, operations, API, testing, and completion records | Verified | Sprint 5 documentation and traceability updated             |

## Sprint 6 delivery controls

Sprint 6 completes only the approved P1 report, settings, filter, historical
Metric, topology-position, and RBAC-polish scope. Later release work remains
deferred.

| Control                                               | Status   | Evidence                                              |
| ----------------------------------------------------- | -------- | ----------------------------------------------------- |
| Additive settings and topology-position migration     | Verified | Both databases current; migration/schema tests passed |
| Network Health Report and bounded Alerts CSV          | Verified | Repository/route/security/browser tests               |
| Shared URL-backed filter contracts                    | Verified | Domain/route/desktop/mobile tests                     |
| Global presentation settings and AlertRule controls   | Verified | Administrator RBAC, validation, audit, and E2E tests  |
| Historical Metric ranges and accessible presentation  | Verified | Repository/route/component/axe tests                  |
| Administrator-saved topology positions                | Verified | Transaction/RBAC/component/reload tests               |
| Regression, responsive, keyboard, reduced motion, axe | Verified | 62-case desktop/mobile Playwright suite               |

## Sprint 7 delivery controls

Sprint 7 implements release-readiness controls locally. Hosted evidence and
release artifacts remain pending separate approval.

| Control                                                    | Status      | Evidence                                        |
| ---------------------------------------------------------- | ----------- | ----------------------------------------------- |
| Render one-Web/one-Worker/paid-PostgreSQL Blueprint        | Verified    | `render.yaml`; config tests; auto-deploy off    |
| Central production environment validation                  | Verified    | fail-closed unit tests and startup integration  |
| Viewer-only public production identity exposure            | Verified    | server policy, login, route, and bundle tests   |
| Minimal liveness/readiness contract                        | Verified    | failure tests and HTTP smoke                    |
| Structured logs, redaction, correlation, graceful shutdown | Verified    | logger/runtime tests and process smoke evidence |
| Empty-only guarded production bootstrap                    | Verified    | authorization and non-destructive refusal tests |
| CI, coverage, restore, smoke, and release tooling          | Verified    | workflow/config/helper validation               |
| SRS-FR-002 complete page/route/use-case authorization      | Verified    | permission, proxy, route, and 93-case E2E audit |
| FR-004 visible Device-reference navigation                 | Verified    | component/source/E2E navigation audit           |
| FR-002 Dashboard range                                     | In Progress | accepted v1 exception: fixed 24-hour Dashboard  |
| FR-007 alert processing                                    | In Progress | supported rules verified; bandwidth disabled    |
| FR-013 / PRD-DASH-002 Health Score                         | In Progress | accepted v1 exception: formula visibly partial  |
| Hosted deployment, restore proof, portfolio media          | Deferred    | requires separate deployment approval           |
| `v0.7.0`, Product Owner Go/No-Go, and `v1.0.0`             | Deferred    | required post-validation release sequence       |
