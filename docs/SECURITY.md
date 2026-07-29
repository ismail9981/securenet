# Security and realtime limitations

SecureNet remains a local Demo. Authentication uses the existing signed HttpOnly
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
