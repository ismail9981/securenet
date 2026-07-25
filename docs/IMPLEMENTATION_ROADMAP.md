# SecureNet implementation roadmap

This roadmap follows DOC-000’s approved sprint sequence and preserves DOC-001
scope/priority precedence.

| Sprint                                   | Approved outcome                                                                                                                      | Principal requirements                                                 | Exit evidence                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 0 — Foundation                           | Repository, tooling, modular boundaries, design tokens, P0 route placeholders, shared states, core types, docs, test harness          | SRS-NFR-006, NFR-004/005/007/010 foundations                           | Format, lint, type-check, unit tests, production build, local run              |
| 1 — Identity, shell, dashboard contracts | Resolve Login priority conflict; implement real sessions/server authorization; dashboard static composition and application contracts | FR-001/002/013, PRD-AUTH-001—003, PRD-DASH-001—005, SRS-FR-001/002/012 | Auth/RBAC unit and integration tests; dashboard contract/component tests       |
| 2 — Devices and telemetry                | Device list/details, safe filters, validation, persistence schema/repositories, latest/history telemetry                              | FR-003—006, PRD-DEV-001—004/006, PRD-DD-001—005, SRS-FR-003—005/009    | Device/metric unit and integration tests; responsive device flows              |
| 3 — Alerts and events                    | Threshold evaluation, deduplication, lifecycle, audited actions, append-only event log                                                | FR-007—010, PRD-ALT-001—004, PRD-EVT-001—003, SRS-FR-006/007/010       | TC-ALT and event tests; baseline conflicts resolved before schema/API lock     |
| 4 — Topology and realtime                | Nodes/connections, state cues, accessible list fallback, compact events, reconnect and snapshot fallback                              | FR-011, PRD-TOP-001—003, SRS-FR-008                                    | Topology accessibility and 30-node checks; realtime integration tests          |
| 5 — Simulation engine                    | Deterministic baseline generation and approved incident/recovery scenarios                                                            | FR-006/007/013 interactions, DOC-011 scenarios                         | Seeded fixture tests; TC-SIM-001 end-to-end evidence                           |
| 6 — Reports, settings, and RBAC polish   | Approved P1 reports, CSV, users, settings, alert-rule controls, role UX polish                                                        | FR-012/014—016 and DOC-002 P1 requirements                             | Role matrix regression; report/export tests                                    |
| 7 — QA, security, deployment, portfolio  | Full regression, accessibility, performance, security, CI/CD, managed deployment, truthful portfolio evidence                         | All AC-01—12 and release gates                                         | 0 blocker/critical defects; release report, live demo, README/video/case study |

## Sprint 1 resolution

The approved clarification resolved IA-001 and IA-004 for Sprint 1. Sprint 1 uses a
Demo-only identity adapter, signed server-verified sessions, server authorization
primitives, typed Dashboard contracts, deterministic fixtures, and only the
unambiguous Health Score deductions. ADR-0002 records the limitations.

Sprint 2 may begin only after Sprint 1 validation and separate approval. Device
persistence, telemetry, alert processing, realtime transport, simulation, and the
unresolved Health Score factors are not pulled forward.
