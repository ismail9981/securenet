# Security and realtime limitations

SecureNet remains Demo software. Authentication uses the existing signed HttpOnly
session cookie and fixed fictional accounts; it is not a production identity
system. Never commit `.env.local`, database URLs, session secrets, or passwords.

The realtime endpoint is read-only, same-origin, and cookie-authenticated. It
rejects unauthenticated, forged, expired, and cross-origin requests; accepts no
query-string token or client publication; limits streams to three per user and 50
total; and bounds messages to 64 KB. Published payloads are allow-listed and
publication failures are logged without secrets.

The in-process event hub is intentionally single-instance and non-durable. It
cannot fan out across multiple server processes and events may be missed during
restart. REST is authoritative, reconnection fetches a fresh snapshot, and
five-second polling is used only while SSE is unavailable. A production
multi-instance deployment requires separately approved distributed pub/sub,
stronger identity/session revocation, HTTPS, operational monitoring, and
production abuse controls.

Database reset tooling refuses any database name except exactly
`securenet_test`. Device archive and topology filtering never hard-delete Device,
Metric, Alert, Event, AuditLog, or NetworkConnection history.

Sprint 5 simulation mutations are Administrator-only and require server-side
`RUN_SIMULATION`, a signed session, same-origin validation, bounded strict input,
an allow-listed scenario code, an idempotency key, and a process-local command
rate limit. Engineer and Viewer sessions cannot access controls or run status.

The single Demo worker uses a PostgreSQL advisory lock. Target-scoped transaction
locks prevent overlapping status-changing runs. PostgreSQL `LISTEN/NOTIFY`
bridges only compact allow-listed committed messages to the existing web SSE
hub; `simulation.status` is delivered only to Administrators and never contains
seed, target details, failure internals, credentials, or connection data.

This remains local Demo infrastructure. It is not a production job system,
distributed scheduler, identity system, or real-device monitoring service.

Sprint 6 read routes continue to verify the signed session. Settings, AlertRule,
and topology-position mutations additionally require Administrator
permission and same-origin validation close to the use case. Inputs are strict
and bounded, writes are transactional, and approved actions append safe AuditLog
metadata without credentials or connection data.

Alerts CSV is capped at 10,000 rows and prefixes cells that could be interpreted
as spreadsheet formulas. Null values remain empty. CSV export does not expose
database errors or internal secrets. The browser bundle and repository are
scanned for server-only environment names and credential material as part of the
Sprint 6 gate.

AR-BW-01 remains disabled and cannot be enabled through the settings API. Sprint 6
adds no automatic Alert resolution, recurrence/reopen, Demo reset, user
management, retention deletion, PDF generation, or production deployment.

Sprint 7 production configuration exposes Viewer login only by default.
Administrator and Network Engineer are rejected authoritatively unless a private
server override is explicitly enabled. Runtime validation fails closed on short
session secrets, non-PostgreSQL URLs, test variables in production, or reserved
production database names.

Public health responses are minimal. Structured logs honor `LOG_LEVEL` and redact
password, secret, token, cookie, authorization, database URL, and connection
string fields. Login retains its five-attempt/15-minute limiter; mutations add a
60-request/minute process-local limiter. These counters reset on restart and are
not distributed. HSTS remains disabled pending stable hosted-domain validation.
