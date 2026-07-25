# ADR-0002: Demo identity and Dashboard contracts

- Status: Accepted for Sprint 1
- Date: 2026-07-24
- Sources: approved Sprint 1 plan; DOC-001, DOC-002, DOC-003, DOC-004,
  DOC-006, DOC-007, DOC-009, DOC-010, DOC-012, DOC-014

## Context

Sprint 1 needs protected Dashboard access, a testable role matrix, and an
operational-looking Dashboard before production identity, persistence, telemetry,
or simulation exist. The approved clarification resolves Login into Sprint 1 but
explicitly prohibits representing Demo identity or Dashboard fixtures as
production-capable or live.

The baseline also gives classification boundaries and some fixed Network Health
Score deductions, but it does not provide unambiguous formulas for average packet
loss, average ping, or degraded-device ratio.

## Decisions

### Demo-only identity adapter

Use a server-only repository containing three fixed, fictional identities:
`ADMIN`, `NETWORK_ENGINEER`, and `VIEWER`. Public credentials are intentionally
available on the Demo login screen so the role matrix is repeatable. Passwords are
stored in the repository adapter only as bcrypt cost-12 hashes and are verified
with constant-work password hashing.

This adapter is not an account database. It provides no registration, password
recovery, user administration, OAuth, federation, persistence, or production
identity lifecycle.

### Signed session cookie

After successful authentication, issue an eight-hour HS256 signed session with an
external `AUTH_SECRET` of at least 32 characters. The cookie is `HttpOnly`,
`SameSite=Lax`, path-scoped to `/`, and `Secure` in production. The token contains
only the allow-listed public identity fields, expiry, and token identifier.

Logout expires the browser cookie. Because sessions are stateless, logout cannot
centrally revoke a copied token before expiry. Secret rotation revokes all
outstanding sessions; targeted revocation and production session lifecycle are
deferred.

### Authentication routes and enforcement

Expose exactly:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Login validates a bounded JSON body, returns generic credential failures, applies
a process-local Demo rate limit, emits structured redacted events, and never
returns password material. The process-local limiter is not distributed and
resets on process restart, so it is not a production abuse-control mechanism.

`proxy.ts` checks only whether a session cookie is present and may redirect early
for navigation convenience. It does not establish identity or permission.
Server-side token verification protects the operations layout, and application
use cases assert the required permission close to the protected operation.

### Deterministic Dashboard source

Use a typed repository port and a fixed in-memory Demo adapter. The generated time,
30-device distribution, KPI totals, twelve traffic points, latest alerts, and
recent events are fixtures. They do not poll, refresh, discover, observe, or
simulate a live network. Presentation must keep the Demo/Simulated label and
explicit fixture disclosure visible.

### Partial Network Health Score

Implement only the unambiguous DOC-001 rules:

- five points per offline critical device, capped at 25;
- four points per open critical alert, capped at 24;
- one point per open warning alert, capped at 10;
- classifications: Excellent at 98–100, Healthy at 90–97, Warning at 75–89,
  and Critical below 75.

The fixture therefore scores 79 from documented deductions. The result is always
marked `formulaComplete: false` and lists average packet loss, average ping, and
degraded-device ratio as unresolved. No interpolation or guessed deduction is
permitted.

## Security and operational limitations

- The deterministic credentials are public and must never protect real data.
- A source-code account list and shared application signing secret do not provide
  production identity governance.
- Stateless sessions have no per-session server-side revocation store.
- The rate limiter is process-local, memory-only, and unsuitable for horizontal
  scaling.
- Security headers and redacted logs reduce risk but do not turn the Demo adapter
  into a production authentication system.
- Dashboard data is fixed and provides no availability or freshness guarantee for
  real infrastructure.
- The Health Score is deliberately incomplete until an approved formula resolves
  all remaining factors.

## Consequences

- Sprint 1 can test authentication and the complete documented role matrix without
  introducing a database or third-party identity provider.
- Server authorization remains reusable when real protected use cases arrive.
- Dashboard contracts can be replaced by later persistence/simulation adapters
  without changing the domain calculation or presentation contract.
- PostgreSQL, Prisma, Supabase, Auth.js, OAuth, production account persistence,
  device telemetry, realtime updates, and a completed Health Score remain outside
  Sprint 1.
