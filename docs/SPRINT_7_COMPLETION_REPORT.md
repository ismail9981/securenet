# Sprint 7 completion report

Status: implementation and local validation complete.

Sprint 7 adds Render and CI readiness, centralized runtime validation,
Viewer-only public production identity exposure, minimal health endpoints,
structured redacted logs, correlation IDs, graceful lifecycle handling,
empty-only production bootstrap, non-destructive restore verification, smoke
tooling, release documents, and final audit coverage. It does not deploy, tag, or
start v1.0.

## Validation evidence

- Branch/HEAD baseline: `main` at `4fb61a2`; annotated `v0.6.0` preserved. No
  DOC-000–DOC-015 file changed.
- `npm ci`, dependency tree, format, zero-warning lint, TypeScript, Prisma
  validate/generate, production build, route review, and audit passed.
- Both databases are current at five migrations; no schema/migration change was
  required. Two test resets passed and the development reset probe refused.
- Vitest: 217 passed, 0 failed, 0 skipped.
- Playwright: 93 passed, 0 failed, 0 skipped across desktop Chromium, 320 px
  Chromium, and desktop WebKit.
- Core coverage: 94.68% statements, 82.37% branches, 97.08% functions, 95.48%
  lines.
- Automated axe, keyboard, reduced-motion, responsive, RBAC, Device navigation,
  realtime, Worker, CSV, bootstrap, health, redaction, abuse-limit, origin, and
  restore-safety checks passed.
- Local HTTP, authentication, protected page/API, CSV, simulation-denial,
  readiness, Worker, and SSE smoke passed.
- Performance: report 566 ms; filtered P95 7 ms; CSV 1,940 ms; history 12 ms;
  topology save 49 ms.
- Repository/client scans passed; `npm audit` found 0 vulnerabilities.

During validation, Device PATCH was corrected to reject empty updates instead of
applying create-time defaults. Explicit test deployment mode now supports local
HTTP across WebKit while real `production-demo` cookies remain Secure.
Cross-project E2E fixtures were isolated without changing product behavior. The
test database reset now serializes transactional deletes to avoid concurrent
queries on one PostgreSQL client, and integration tests use explicit 30-second
hook/test timing budgets.

AR-BW-01 remains disabled. Partial Health Score disclosure remains. No Demo
reset, user management, Alert auto-resolution/recurrence, incident overlay, PDF,
distributed realtime, deployment, release, or later-sprint work was added.

## File inventory

Created (36):

`.github/workflows/ci.yml`, `app/api/health/health-routes.test.ts`,
`app/api/health/live/route.ts`, `app/api/health/ready/route.ts`,
`docs/BACKUP_RESTORE.md`, `docs/DEPLOYMENT.md`,
`docs/FINAL_ACCESSIBILITY_REPORT.md`, `docs/FINAL_PERFORMANCE_REPORT.md`,
`docs/FINAL_SECURITY_REPORT.md`, `docs/FINAL_TEST_REPORT.md`,
`docs/KNOWN_LIMITATIONS.md`, `docs/PORTFOLIO_CAPTURE_CHECKLIST.md`,
`docs/PORTFOLIO_CASE_STUDY_DRAFT.md`, `docs/RELEASE_CHECKLIST.md`,
`docs/SPRINT_7_COMPLETION_REPORT.md`,
`docs/adr/0008-render-deployment-release-readiness-and-v1-boundary.md`,
`lib/api-security.test.ts`, `lib/health.test.ts`, `lib/health.ts`,
`lib/logger.test.ts`, `lib/runtime-environment.test.ts`,
`lib/runtime-environment.ts`, `modules/event-log/domain/event.test.ts`,
`modules/identity/infrastructure/mutation-rate-limit.test.ts`,
`modules/identity/infrastructure/mutation-rate-limit.ts`,
`next-config.test.ts`, `proxy.test.ts`, `render.yaml`,
`scripts/production-bootstrap.test.ts`, `scripts/production-bootstrap.ts`,
`scripts/production-smoke.ts`, `scripts/start-web.ts`,
`scripts/verify-restored-database.test.ts`,
`scripts/verify-restored-database.ts`, `tests/release-readiness.test.ts`, and
`vitest.coverage.config.ts`.

Modified (33):

`.env.example`, `CHANGELOG.md`, `README.md`,
`app/api/v1/auth/login/route.ts`, `app/api/v1/auth/logout/route.ts`,
`app/login/page.tsx`, `docs/API.md`, `docs/IMPLEMENTATION_ASSUMPTIONS.md`,
`docs/IMPLEMENTATION_ROADMAP.md`, `docs/OPERATIONS.md`,
`docs/REQUIREMENTS_TRACKER.md`, `docs/SECURITY.md`, `docs/TESTING.md`,
`lib/api.ts`, `lib/logger.ts`, `modules/README.md`,
`modules/identity/infrastructure/auth-service.ts`,
`modules/identity/infrastructure/session.test.ts`,
`modules/identity/infrastructure/session.ts`,
`modules/identity/presentation/LoginForm.test.tsx`,
`modules/identity/presentation/LoginForm.tsx`,
`modules/inventory/domain/device.test.ts`,
`modules/inventory/domain/device.ts`, `package.json`, `playwright.config.ts`,
`proxy.ts`, `scripts/README.md`, `scripts/reset-test-database.ts`,
`scripts/simulation-worker.ts`,
`tests/e2e/sprint-four-topology-realtime.spec.ts`,
`tests/e2e/sprint-six-reports-settings-history.spec.ts`, and
`tests/integration/auth-routes.test.ts`, and `vitest.config.ts`.

## Hosted evidence

Deployment, hosted HTTPS/smoke/accessibility/performance, provider backup
retention confirmation, isolated restore execution, portfolio media, `v0.7.0`,
and `v1.0.0` remain pending separate approval.
