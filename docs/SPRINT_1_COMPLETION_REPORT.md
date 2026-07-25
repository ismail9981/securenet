# Sprint 1 completion and validation report

Date: 2026-07-25  
Status: Complete and validated  
Boundary: Sprint 1 only; Sprint 2 has not begun

## 1. Delivered scope

Sprint 1 implements the approved server-only Demo identity adapter, deterministic
`ADMIN`, `NETWORK_ENGINEER`, and `VIEWER` accounts, bcrypt password verification,
signed HttpOnly sessions, exact authentication routes, optimistic proxy redirects,
authoritative server verification, and application permission assertions.

It also implements typed Dashboard contracts and a deterministic fixture adapter
for KPIs, device distribution, traffic, alerts, events, and timestamp. The Network
Health Score applies only approved fixed deductions and classification boundaries;
the contract and UI explicitly mark the remaining formula incomplete.

## 2. Security and Demo boundaries

- Identity is explicitly Demo-only and must not protect real data.
- Credentials are public for deterministic RBAC testing; repository passwords are
  represented by bcrypt cost-12 hashes.
- Session cookies are signed, HttpOnly, SameSite=Lax, and Secure in production.
- Stateless logout expires the browser cookie but cannot centrally revoke a copied
  token before expiry.
- Login input is schema-validated and byte-bounded, failures are generic, and the
  process-local rate limit is a Demo safeguard rather than distributed protection.
- Structured authentication logs redact password, hash, token, cookie, and
  authorization fields.
- Dashboard values are fixed fixtures and are never represented as live monitoring.
- Packet-loss, ping, and degraded-device-ratio deductions remain unresolved; no
  interpolation was invented.

ADR-0002 and IA-011 through IA-015 record these limitations.

## 3. Validation environment and corrections

The existing workspace `node_modules` repeatedly blocked Node and native tools on
small dependency-file reads. Application source copied immediately when
`node_modules` was excluded. Validation therefore used an exact temporary source
copy under `/private/tmp`, omitted only Git/generated artifacts, and installed the
project lockfile with `npm ci`. No implementation source was changed merely to work
around the host filesystem issue.

The first complete browser run executed all 18 cases and reported 8 passed and 10
failed. Diagnosis produced one genuine implementation correction and two test
corrections:

- Recharts exposed a focusable SVG inside an `aria-hidden` decorative container.
  Its redundant accessibility layer was disabled; the equivalent textual traffic
  summary remains available.
- Auth identity assertions now use browser `fetch`, because Playwright's separate
  request context did not forward the browser's production Secure cookie over the
  local HTTP test origin.
- Dashboard assertions select the intended Demo badge and approved incomplete-score
  disclosure, and axe waits for streamed page metadata before analysis.

The affected six role checks passed, then the remaining four Dashboard/axe checks
passed. The complete suite was rerun twice successfully, including once after the
final dependency correction.

The current npm advisory service also identified a new high-severity
denial-of-service chain through ESLint's transitive `minimatch`. A narrow
`minimatch` 10.2.5 override was applied. A global `brace-expansion` override was
tested and rejected because it broke the older minimatch API. The accepted override
passed ESLint, every test, the production build, and a zero-vulnerability audit.

## 4. Test inventory and exact results

Ten Vitest files cover domain, application, infrastructure, route integration, and
components. The Playwright suite covers desktop and mobile unauthenticated
redirect, generic login failure, all three role identities, Dashboard fixtures and
Health Score disclosure, protected mobile navigation, logout, and automated WCAG
checks.

Final test totals:

| Suite                                   | Passing | Failing | Skipped |
| --------------------------------------- | ------: | ------: | ------: |
| Vitest unit/integration/route/component |      32 |       0 |       0 |
| Playwright desktop/mobile/axe           |      18 |       0 |       0 |
| **Final total**                         |  **50** |   **0** |   **0** |

Diagnostic failing runs are not included in the final totals. They are recorded in
Section 3 and were followed by affected-test and complete-suite reruns.

## 5. Final validation evidence

| Command or check                  | Result                                                               |
| --------------------------------- | -------------------------------------------------------------------- |
| Sprint 0 baseline commit          | Passed: `a83fdeb chore: establish Sprint 0 project foundation`       |
| `npm ci`                          | Passed from the committed lockfile; 505 packages installed           |
| `npm run format:check`            | Passed                                                               |
| `npm run lint`                    | Passed; zero warnings/errors                                         |
| `npm run type-check`              | Passed; generated route types and strict TypeScript                  |
| `npm test`                        | Passed; 10 files, 32 tests                                           |
| `npm run test:e2e`                | Passed; 18 desktop/mobile/axe tests                                  |
| `npm run build`                   | Passed; 12 application routes/boundaries plus Proxy                  |
| `npm ls --depth=0`                | Passed; direct dependency tree valid                                 |
| `npm audit`                       | Passed; zero vulnerabilities                                         |
| Previous Sprint 1 coverage run    | Passed; 73.64% statements, 63.93% branches, 71.87% functions         |
| Local unauthenticated Dashboard   | Passed; HTTP 307 with `Location: /login`                             |
| Local valid login and `/me`       | Passed; HTTP 200 and `NETWORK_ENGINEER` allow-listed identity        |
| Local authenticated Dashboard     | Passed; HTTP 200 and fixed-fixture disclosure present                |
| Local invalid login               | Passed; HTTP 401 with generic credential message                     |
| Local logout and subsequent `/me` | Passed; logout HTTP 200, subsequent identity request HTTP 401        |
| Production security headers       | Passed; CSP, referrer, nosniff, frame denial, and permissions policy |

The production auth smoke emitted structured success, failure, and logout events
without exposing credentials or session tokens.

## 6. Requirements intentionally still in progress

- FR-002: Sprint 1 supplies one fixed 24-hour traffic range, not an interactive
  range selector or resource charts.
- FR-013 and PRD-DASH-002: classification and approved fixed deductions exist, but
  the complete Health Score formula does not.
- SRS-FR-002: server permission enforcement exists for the Dashboard and the full
  role matrix is defined, but later protected mutation use cases do not exist yet.
- SRS-FR-012: actor identity exists, but administrative actions and audit records
  belong to later sprints.
- Release-wide browser, performance, deployment, and manual WCAG gates remain
  assigned to their documented later phases.

No partially implemented requirement is marked Verified.

## 7. Explicitly outside Sprint 1

PostgreSQL, Prisma, Supabase, Auth.js, OAuth, registration, password recovery,
production account persistence, targeted session revocation, live monitoring,
device/telemetry implementation, alert processing, realtime transport, topology
implementation, simulation, and guessed Health Score formulas were not added.

Sprint 2 has not begun.
