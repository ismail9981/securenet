# Final test report

Status: local Sprint 7 validation passed on 2026-07-29.

- Immutable install and dependencies: `npm ci` and `npm ls --depth=0` passed.
- Formatting, zero-warning ESLint, strict TypeScript, Prisma validate/generate,
  and the production build passed.
- Development and test report all five migrations current. No Sprint 7 schema or
  migration change exists.
- Two deterministic `securenet_test` resets passed; a reset pointed at
  `securenet_dev` refused before mutation.
- Vitest: 60 files, 217 passed, 0 failed, 0 skipped.
- Playwright: 93 passed, 0 failed, 0 skipped: 31 desktop Chromium, 31 Chromium at
  320 px, and 31 desktop WebKit.
- Core coverage: 94.68% statements, 82.37% branches, 97.08% functions, and
  95.48% lines.
- Local health, three-role authentication, protected modules, Alerts CSV,
  Viewer simulation denial, Worker, and authenticated SSE smoke passed.
- Repository secret, client-bundle identity/environment, and forbidden-scope
  scans passed. `npm audit --audit-level=high` found 0 vulnerabilities.

The unique authoritative regression total is 310 passed, 0 failed, 0 skipped
(217 Vitest + 93 Playwright). The coverage command re-executed the 216 Vitest
cases successfully and is reported separately rather than double-counted.

Hosted checks, actual Microsoft Edge, VoiceOver, provider restore execution, and
portfolio capture remain pending the separately approved deployment sequence.
