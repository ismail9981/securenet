# Render deployment runbook

This runbook is readiness documentation. No Sprint 7 implementation command
deploys SecureNet.

## Approved topology

- `securenet-web`: one persistent Node Web Service, `/api/health/ready` health
  check, 30-second graceful shutdown.
- `securenet-worker`: one Node Background Worker, PostgreSQL advisory ownership,
  30-second graceful shutdown.
- `securenet-postgres`: paid PostgreSQL 17 with external access disabled by the
  Blueprint and private `connectionString` injected into both processes.

`render.yaml` disables automatic deployments. Do not scale either service above
one instance: SSE subscribers and rate-limit counters are process-local.

## Production configuration

Set `AUTH_SECRET` and `SEED_DEMO_PASSWORD` as private Render values. Keep
`SECURENET_DEPLOYMENT_ENV=production-demo`,
`DEMO_PRIVATE_ROLE_LOGIN_ENABLED=false`, and
`ALLOW_PRODUCTION_DEMO_BOOTSTRAP=false`. Never configure `TEST_DATABASE_URL` in
production. Confirm the Render-injected database name matches
`SECURENET_PRODUCTION_DATABASE_NAME`.

The public login page and bundle expose only Viewer. Administrator and Network
Engineer may be temporarily enabled only by private server configuration and
remain subject to the same server authorization.

## Release procedure

1. Pass CI from immutable `package-lock.json`.
2. Record provider PITR availability and create/download the pre-release logical
   export described in `BACKUP_RESTORE.md`.
3. Obtain manual approval in the GitHub `production` environment.
4. Manually initiate the Render deployment.
5. Render runs `npm run db:migrate:deploy` once as the Web pre-deploy command.
   Abort on failure; do not start either new process.
6. Confirm migration status, readiness, one Web/one Worker, structured lifecycle
   logs, and Render health alerts.
7. Run `npm run smoke:production` from a controlled operator environment.
8. Complete the hosted security, accessibility, performance, restore, and
   portfolio evidence. Use a forward-fix migration if correction is necessary.

Render supplies HTTPS for the `onrender.com` domain. Secure cookies, same-origin
mutation checks, CSP, and proxy host handling must be verified against the final
URL. HSTS is intentionally not enabled until the stable domain policy is
validated.
