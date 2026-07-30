# ADR-0008: Render deployment readiness and the v1 boundary

- Status: Accepted
- Date: 2026-07-29

## Context

Sprint 7 prepares the approved Demo for deployment without converting it into a
production monitoring or identity product. The existing SSE hub and command
limiters are process-local, and the simulation worker already uses PostgreSQL
advisory ownership.

## Decision

The deployment target is one persistent Render Web Service, one Render
Background Worker, and one paid Render PostgreSQL 17 database. Both services are
manually scaled to one instance. Automatic Render deploys are disabled. The
database private connection string is injected by Render; no credentials are
stored in Git.

The Web pre-deploy command is `npm run db:migrate:deploy`. Builds and process
start commands never migrate. A critical release requires a provider restore
point and a separately verified logical export. Migration failure aborts the
release; schema correction uses a forward migration.

Production Demo login exposes Viewer only. Administrator and Network Engineer
remain private unless `DEMO_PRIVATE_ROLE_LOGIN_ENABLED=true` is explicitly set
server-side. The server rejects blocked identities even when valid credentials
are supplied. Local development retains all three accounts. This remains the
Demo adapter, not production identity.

Production bootstrap is a one-time operator command, never a deploy hook. It
requires the `production-demo` environment, an explicit bootstrap flag, an exact
database-name match, and an entirely empty operational database. Any existing
history causes refusal. It never invokes the test reset. Seed addresses remain
private/test fixtures and AR-BW-01 remains disabled.

`/api/health/live` reports process liveness only. `/api/health/ready` validates
required environment configuration and PostgreSQL connectivity. Both return
minimal public JSON and expose no environment, migration, worker, host, or
database details.

Application and worker logs are structured JSON, honor `LOG_LEVEL`, redact
credential/connection fields, and include correlation IDs where request context
exists. Render logs, health monitoring, platform alerts, and controlled AuditLog
review are the approved operational evidence. No third-party telemetry service
is added.

GitHub Actions validates pull requests and `main`. A manual `workflow_dispatch`
eligibility job references the protected `production` environment but performs
no deployment. Required reviewers are configured in GitHub, outside this file.

## Accepted v1 limitations

- Dashboard trend is fixed at 24 hours; Device Details supports 1 hour–30 days.
- CPU, RAM, Ping, Packet Loss, and status alert behavior is supported. Bandwidth
  utilization and AR-BW-01 remain disabled.
- Network Health Score remains explicitly partial; no missing formula is invented.
- Realtime and mutation limits are single-process. There is no horizontal Web
  scaling, distributed fan-out, Redis, queue, or production monitoring claim.
- AuditLog has controlled evidence only; no UI or public API.
- Demo authentication has stateless-session revocation and account-management
  limitations. Administrator/Engineer production access is private.

## Release boundary

Sprint 7 completion permits review for `v0.7.0`; it does not create the tag.
Deployment, hosted smoke tests, restore proof, portfolio capture, Product Owner
Go/No-Go, and `v1.0.0` are separate approved actions in that order.
