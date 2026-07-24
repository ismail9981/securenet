# Requirements implementation tracker

Updated: 2026-07-24  
Baseline: SecureNet Full Documentation Baseline v1.0

Status vocabulary follows DOC-014: `Not Started`, `In Progress`, `Implemented`,
`Verified`, `Deferred`, or `Rejected`. A Sprint 0 placeholder makes a route
`In Progress`; it does not satisfy the product requirement.

## DOC-001 P0 functional requirements

| Requirement ID | Requirement title                         | Priority | Source document | Planned phase | Current status | Related files                            | Related tests                      |
| -------------- | ----------------------------------------- | -------- | --------------- | ------------- | -------------- | ---------------------------------------- | ---------------------------------- |
| FR-001         | Device/alert totals and network health    | P0       | DOC-001 §11     | Sprint 1      | In Progress    | `app/(operations)/dashboard/page.tsx`    | Planned `TC-DASH-001`              |
| FR-002         | Traffic and resource charts by time range | P0       | DOC-001 §11     | Sprint 1      | In Progress    | Dashboard placeholder                    | Planned dashboard component tests  |
| FR-003         | Searchable/filterable/sortable devices    | P0       | DOC-001 §11     | Sprint 2      | In Progress    | `app/(operations)/devices/page.tsx`      | `TC-DEV-001` planned               |
| FR-004         | Open device details from every reference  | P0       | DOC-001 §11     | Sprint 2      | In Progress    | `/devices`, `/devices/[id]` placeholders | Playwright navigation planned      |
| FR-005         | Latest and historical device metrics      | P0       | DOC-001 §11     | Sprint 2      | In Progress    | `app/(operations)/devices/[id]/page.tsx` | `TC-MET-001` planned               |
| FR-006         | Simulation-driven automatic device state  | P0       | DOC-001 §11     | Sprint 5      | Not Started    | Planned Simulation/Monitoring modules    | `TC-MET-001`, `TC-SIM-001` planned |
| FR-007         | Threshold-based alert creation            | P0       | DOC-001 §11     | Sprint 3      | In Progress    | `app/(operations)/alerts/page.tsx`       | `TC-ALT-001` planned               |
| FR-008         | Open-alert deduplication                  | P0       | DOC-001 §11     | Sprint 3      | Not Started    | Planned Alerting domain                  | `TC-ALT-002` planned               |
| FR-009         | Audited acknowledge and resolve           | P0       | DOC-001 §11     | Sprint 3      | In Progress    | Alerts placeholder                       | `TC-ALT-003/004` planned           |
| FR-010         | Important changes written to Event Log    | P0       | DOC-001 §11     | Sprint 3      | In Progress    | `app/(operations)/events/page.tsx`       | `TC-EVT-001` planned               |
| FR-011         | Status-aware network topology             | P0       | DOC-001 §11     | Sprint 4      | In Progress    | `app/(operations)/topology/page.tsx`     | `TC-TOP-001` planned               |
| FR-013         | Automatic Network Health Score            | P0       | DOC-001 §11     | Sprint 1      | In Progress    | Dashboard placeholder                    | `TC-HLT-001` planned               |

## DOC-002 P0 product requirements

| Requirement ID | Requirement title                            | Priority    | Source document | Planned phase | Current status | Related files                        | Related tests                       |
| -------------- | -------------------------------------------- | ----------- | --------------- | ------------- | -------------- | ------------------------------------ | ----------------------------------- |
| PRD-AUTH-001   | Email/password sign in                       | P0 conflict | DOC-002 §8.1    | Sprint 1      | Not Started    | See IA-001                           | `TC-AUTH-001` planned               |
| PRD-AUTH-002   | Clearly presented Demo account               | P0 conflict | DOC-002 §8.1    | Sprint 1      | Not Started    | Demo disclosure only; no credentials | Auth component/E2E planned          |
| PRD-AUTH-003   | Generic failed-login message                 | P0 conflict | DOC-002 §8.1    | Sprint 1      | Not Started    | Planned Identity presentation        | `TC-AUTH-002` planned               |
| PRD-DASH-001   | Device and critical-alert totals             | P0          | DOC-002 §8.2    | Sprint 1      | In Progress    | Dashboard placeholder                | `TC-DASH-001` planned               |
| PRD-DASH-002   | Health Score and classification              | P0          | DOC-002 §8.2    | Sprint 1      | In Progress    | Dashboard placeholder                | `TC-HLT-001` planned                |
| PRD-DASH-003   | Bandwidth trend                              | P0          | DOC-002 §8.2    | Sprint 1      | In Progress    | Dashboard placeholder                | Dashboard component test planned    |
| PRD-DASH-004   | Linked latest alerts and events              | P0          | DOC-002 §8.2    | Sprint 1      | In Progress    | Dashboard placeholder                | Dashboard integration test planned  |
| PRD-DASH-005   | Update without page reload                   | P0          | DOC-002 §8.2    | Sprint 4      | Not Started    | Planned realtime/cache adapter       | `TC-RT-001` planned                 |
| PRD-DEV-001    | Device table with status and metrics         | P0          | DOC-002 §8.3    | Sprint 2      | In Progress    | Devices placeholder                  | `TC-DEV-001` planned                |
| PRD-DEV-002    | Search name/hostname/IP                      | P0          | DOC-002 §8.3    | Sprint 2      | Not Started    | Planned Inventory application        | `TC-DEV-001` planned                |
| PRD-DEV-003    | Filter type/status/location                  | P0          | DOC-002 §8.3    | Sprint 2      | Not Started    | Planned Inventory application        | Device filter tests planned         |
| PRD-DEV-004    | Sort and paginate devices                    | P0          | DOC-002 §8.3    | Sprint 2      | Not Started    | Planned Inventory application        | Device pagination tests planned     |
| PRD-DEV-006    | Unique active IP and hostname                | P0          | DOC-002 §8.3    | Sprint 2      | Not Started    | Planned Inventory domain/repository  | `TC-DEV-002` planned                |
| PRD-DD-001     | Device identity/location/OS/status/last seen | P0          | DOC-002 §8.4    | Sprint 2      | In Progress    | Device details placeholder           | Device details test planned         |
| PRD-DD-002     | Device metric summaries                      | P0          | DOC-002 §8.4    | Sprint 2      | In Progress    | Device details placeholder           | Metric component tests planned      |
| PRD-DD-003     | Metric history by selected range             | P0          | DOC-002 §8.4    | Sprint 2      | Not Started    | Planned Telemetry application        | Metric range tests planned          |
| PRD-DD-004     | Device alerts and events                     | P0          | DOC-002 §8.4    | Sprint 2/3    | In Progress    | Device details placeholder           | Details integration test planned    |
| PRD-DD-005     | Explain unavailable data                     | P0          | DOC-002 §8.4    | Sprint 2      | In Progress    | Shared empty/error foundations       | Stale/empty component tests planned |
| PRD-ALT-001    | Filter alerts by severity/status/device/time | P0          | DOC-002 §8.5    | Sprint 3      | In Progress    | Alerts placeholder                   | Alert filter tests planned          |
| PRD-ALT-002    | Acknowledge with actor and time              | P0          | DOC-002 §8.5    | Sprint 3      | Not Started    | Planned Alerting application         | `TC-ALT-003` planned                |
| PRD-ALT-003    | Resolve with optional note                   | P0          | DOC-002 §8.5    | Sprint 3      | Not Started    | Planned Alerting application         | `TC-ALT-004` planned                |
| PRD-ALT-004    | Prevent duplicate open alerts                | P0          | DOC-002 §8.5    | Sprint 3      | Not Started    | Planned Alerting domain/repository   | `TC-ALT-002` planned                |
| PRD-EVT-001    | Record state/alert/admin events              | P0          | DOC-002 §8.6    | Sprint 3      | In Progress    | Events placeholder                   | `TC-EVT-001` planned                |
| PRD-EVT-002    | Search/filter/browse event timeline          | P0          | DOC-002 §8.6    | Sprint 3      | Not Started    | Planned Event Log application        | Event query tests planned           |
| PRD-EVT-003    | Event records immutable in UI                | P0          | DOC-002 §8.6    | Sprint 3      | Not Started    | Planned Event Log policy             | Authorization tests planned         |
| PRD-TOP-001    | Display topology nodes/links/types           | P0          | DOC-002 §8.7    | Sprint 4      | In Progress    | Topology placeholder                 | `TC-TOP-001` planned                |
| PRD-TOP-002    | Node status encoding                         | P0          | DOC-002 §8.7    | Sprint 4      | Not Started    | Planned Topology presentation        | Topology accessibility test planned |
| PRD-TOP-003    | Open device summary from node                | P0          | DOC-002 §8.7    | Sprint 4      | Not Started    | Planned Topology presentation        | Playwright topology flow planned    |

## DOC-003 P0 software requirements

| Requirement ID | Requirement title                              | Priority | Source document | Planned phase | Current status | Related files                  | Related tests                           |
| -------------- | ---------------------------------------------- | -------- | --------------- | ------------- | -------------- | ------------------------------ | --------------------------------------- |
| SRS-FR-001     | Authenticate protected routes                  | P0       | DOC-003 §4      | Sprint 1      | Not Started    | Planned Identity module        | `TC-AUTH-001/002` planned               |
| SRS-FR-002     | Enforce authorization on server                | P0       | DOC-003 §4      | Sprint 1      | Not Started    | Planned application policy     | `TC-RBAC-001` planned                   |
| SRS-FR-003     | Immutable device identifier                    | P0       | DOC-003 §4      | Sprint 2      | Not Started    | Planned Inventory domain       | Repository tests planned                |
| SRS-FR-004     | Metric source and received times               | P0       | DOC-003 §4      | Sprint 2      | Not Started    | Planned Telemetry domain       | `TC-MET-001` planned                    |
| SRS-FR-005     | Determine stale data by configuration          | P0       | DOC-003 §4      | Sprint 2      | Not Started    | Planned Monitoring domain      | Stale-data unit tests planned           |
| SRS-FR-006     | Evaluate alert rules after metric batch        | P0       | DOC-003 §4      | Sprint 3      | Not Started    | Planned Alerting application   | `TC-ALT-001/002` planned                |
| SRS-FR-007     | Event for every important transition           | P0       | DOC-003 §4      | Sprint 3      | Not Started    | Planned Event Log application  | `TC-EVT-001` planned                    |
| SRS-FR-008     | Realtime client updates                        | P0       | DOC-003 §4      | Sprint 4      | Not Started    | ADR realtime plan only         | `TC-RT-001` planned                     |
| SRS-FR-009     | Safe pagination and filters                    | P0       | DOC-003 §4      | Sprint 2/3    | Not Started    | Planned application query DTOs | Query validation tests planned          |
| SRS-FR-010     | No permanent operational-record deletion in UI | P0       | DOC-003 §4      | Sprint 3      | Not Started    | Planned policy/repositories    | Authorization/integration tests planned |
| SRS-FR-012     | Actor identity on administrative actions       | P0       | DOC-003 §4      | Sprint 1/3    | Not Started    | Planned Identity/Audit modules | Audit integration tests planned         |

## Release quality requirements

These baseline NFRs do not carry P0/P1/P2 values in their source tables. They are
treated as release-wide gates rather than silently assigning a priority.

| Requirement ID | Requirement title                           | Priority     | Source document | Planned phase        | Current status | Related files                   | Related tests                        |
| -------------- | ------------------------------------------- | ------------ | --------------- | -------------------- | -------------- | ------------------------------- | ------------------------------------ |
| NFR-001        | Dashboard load under 3 seconds              | Release gate | DOC-001 §12     | Sprint 7             | Not Started    | Planned performance budget      | Lighthouse planned                   |
| NFR-002        | Simulation changes visible within 5 seconds | Release gate | DOC-001 §12     | Sprint 4/5           | Not Started    | Planned realtime/simulation     | `TC-RT-001`, `TC-SIM-001`            |
| NFR-003        | Current Chrome/Safari/Edge                  | Release gate | DOC-001 §12     | Sprint 7             | In Progress    | Standards-based foundation      | Browser matrix planned               |
| NFR-004        | Responsive from 320 px                      | Release gate | DOC-001 §12     | Every sprint         | In Progress    | App shell and CSS               | Foundation Playwright mobile         |
| NFR-005        | Maintainable modules and names              | Release gate | DOC-001 §12     | Every sprint         | In Progress    | `modules/README.md`, ADR        | Static review                        |
| NFR-006        | Input, route, and secret protection         | Release gate | DOC-001 §12     | Sprint 1–7           | In Progress    | `.gitignore`, `.env.example`    | Secret scan planned                  |
| NFR-007        | Keyboard, contrast, headings, labels        | Release gate | DOC-001 §12     | Every sprint         | In Progress    | Shell/shared states/CSS         | Accessibility E2E planned            |
| NFR-008        | Survive missing metric/request failure      | Release gate | DOC-001 §12     | Every feature sprint | In Progress    | Empty/error foundations         | `TC-ERR-001` planned                 |
| NFR-009        | Auditable important operations/errors       | Release gate | DOC-001 §12     | Sprint 1–3           | Not Started    | Planned Audit/Event modules     | Audit tests planned                  |
| NFR-010        | Clearly identify simulation                 | Release gate | DOC-001 §12     | Every sprint         | In Progress    | `DemoDataBadge`, metadata       | Foundation E2E                       |
| SRS-NFR-001    | Typical read P95 under 500 ms               | Release gate | DOC-003 §9      | Sprint 7             | Not Started    | Planned API performance checks  | Load test planned                    |
| SRS-NFR-002    | Initial load under 3 seconds                | Release gate | DOC-003 §9      | Sprint 7             | Not Started    | Planned performance budget      | Lighthouse planned                   |
| SRS-NFR-003    | Demo targets 99% monthly availability       | Release gate | DOC-003 §9      | Sprint 7             | Not Started    | Planned deployment/monitoring   | Operations review                    |
| SRS-NFR-004    | HTTPS and externalized secrets              | Release gate | DOC-003 §9      | Sprint 7             | In Progress    | `.env.example`, `.gitignore`    | Deployment/secret scan planned       |
| SRS-NFR-005    | Strong password hashing                     | Release gate | DOC-003 §9      | Sprint 1             | Not Started    | Planned Identity infrastructure | Auth integration tests planned       |
| SRS-NFR-006    | Strict TypeScript and clean lint            | Release gate | DOC-003 §9      | Every sprint         | Verified       | `tsconfig.json`, ESLint config  | `npm run type-check`, `npm run lint` |
| SRS-NFR-007    | Keyboard and WCAG AA fundamentals           | Release gate | DOC-003 §9      | Every sprint         | In Progress    | Shell/shared states/CSS         | Accessibility E2E planned            |
| SRS-NFR-008    | Operate from 320 px                         | Release gate | DOC-003 §9      | Every sprint         | In Progress    | Responsive shell                | Foundation Playwright mobile         |
| SRS-NFR-009    | Structured critical logs                    | Release gate | DOC-003 §9      | Sprint 1/3           | Not Started    | Planned observability adapter   | Logging tests planned                |
| SRS-NFR-010    | No real personal data in Demo               | Release gate | DOC-003 §9      | Every sprint         | In Progress    | Scope/content rules             | Seed review planned                  |

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
