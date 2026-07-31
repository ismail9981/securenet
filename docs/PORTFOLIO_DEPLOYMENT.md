# Free portfolio deployment

This is a separate, non-production portfolio path. It does not replace or
weaken the paid one-Web/one-Worker/managed-PostgreSQL architecture in
`render.yaml` and `docs/DEPLOYMENT.md`.

## Architecture

- One Render Free Node Web Service from `render.portfolio.yaml`.
- One external Neon Free PostgreSQL database.
- The public Render `onrender.com` HTTPS domain only.
- One public Viewer Demo account. Administrator and Network Engineer login stay
  disabled.
- No Background Worker, Render PostgreSQL, Redis, private service, cron job,
  persistent disk, custom domain, or paid Render resource.

The Web Service serves all read-only Dashboard, Devices, Alerts, Events,
Topology, Reports, and Settings views. Native SSE and REST recovery can still
reflect committed database changes, but no persistent simulation Worker exists.
Simulation commands are unavailable and the UI explains that the full
production architecture is required.

## 1. Create the Neon Free database

1. Create a Neon Free project and database dedicated only to this portfolio
   instance.
2. Copy its PostgreSQL connection string into a private operator environment.
   Never paste it into Git, this document, logs, issues, or screenshots.
3. Record only the database name separately. It must not be `securenet_dev`,
   `securenet_test`, `postgres`, or a template database.
4. Use the provider's pooled connection string if that is the connection option
   Neon recommends for the application runtime. Keep TLS parameters supplied by
   Neon intact.

The application makes no backup, durability, recovery-time, or retention
guarantee for this free portfolio database. Any limited Neon Free restore
window is a provider feature, not a SecureNet backup. Do not store real,
personal, confidential, or operational data.

## 2. Apply migrations and bootstrap once

From a trusted local checkout, set the required variables in a private shell or
untracked `.env.local`. First apply the additive Prisma migrations:

```bash
npm ci
npm run prisma:generate
npm run db:migrate:deploy
```

Then explicitly authorize the one-time, empty-only bootstrap:

```bash
SECURENET_PORTFOLIO_MODE=true \
ALLOW_PORTFOLIO_BOOTSTRAP=true \
npm run db:portfolio:bootstrap
```

The private environment must also contain all required variables listed below.
The guard verifies production portfolio mode, an exact allow-listed database
name, and a Neon hostname. It counts every SecureNet application table and
refuses any populated target. It never resets or deletes existing data. The
deterministic seed keeps `AR-BW-01` disabled.

Immediately return `ALLOW_PORTFOLIO_BOOTSTRAP` to `false` after the command.
The bootstrap is intentionally absent from the Render build and start commands,
so it never runs on deploy or restart.

## 3. Create the Render Free Web Service

Create a Render Blueprint that points at `render.portfolio.yaml` on `main`.
Confirm the plan shows exactly one Free Web Service before applying it. Supply
every `sync: false` value through Render's environment settings; do not place
secret values in the Blueprint.

Required environment variable names:

| Name                                 | Purpose                                              |
| ------------------------------------ | ---------------------------------------------------- |
| `DATABASE_URL`                       | Neon PostgreSQL connection string, supplied manually |
| `AUTH_SECRET`                        | Generated private session-signing secret             |
| `SEED_DEMO_PASSWORD`                 | Public portfolio Viewer Demo password                |
| `SECURENET_PRODUCTION_DATABASE_NAME` | Exact Neon database name                             |
| `SECURENET_PORTFOLIO_DATABASE_NAME`  | Same exact name, used by the bootstrap guard         |
| `SECURENET_DEPLOYMENT_ENV`           | `production-demo`                                    |
| `SECURENET_PORTFOLIO_MODE`           | `true`                                               |
| `DEMO_PRIVATE_ROLE_LOGIN_ENABLED`    | `false`                                              |
| `ALLOW_PRODUCTION_DEMO_BOOTSTRAP`    | `false`                                              |
| `ALLOW_PORTFOLIO_BOOTSTRAP`          | `false` during all normal deploys and runtime        |
| `NEXT_PUBLIC_APP_NAME`               | `SecureNet`                                          |
| `NEXT_PUBLIC_DEMO_MODE`              | `true`                                               |
| `LOG_LEVEL`                          | `info`                                               |

Do not configure `TEST_DATABASE_URL`. Before making the site public, verify
`/api/health/ready`, Viewer login, all seven read-only views, secure session
cookies, the Portfolio Demo disclosure, private-role rejection, and simulation
unavailability.

## Limitations

- This configuration is a portfolio preview, not production-grade.
- Render Free Web Services can spin down after inactivity. The first request
  after a cold start can take about a minute.
- There is no persistent simulation Worker. Automatically changing metrics and
  simulation lifecycle processing do not run.
- The Web filesystem is ephemeral and no persistent disk is configured.
- The service and external database have free-tier quotas, availability, and
  suspension limits.
- No application-managed backup, point-in-time recovery, SLA, scaling,
  distributed realtime, or operational support claim is made.
- Public access is Viewer-only. This is Demo identity, not a production account
  system.
- Data is deterministic simulated fixture data and must never be represented as
  live network monitoring.

## Upgrade to the full architecture

Use `render.yaml` and `docs/DEPLOYMENT.md`; do not mutate this portfolio
Blueprint into production. Provision the paid Web Service, paid Background
Worker, and paid Render PostgreSQL resource, follow the production migration,
backup/restore, smoke, and release gates, and keep the production Viewer-only
default unless private-role access is explicitly approved. The full
architecture retains the persistent Worker and its documented single-instance
operational controls.
