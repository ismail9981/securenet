# Project scripts

`reset-test-database.ts` is the only destructive maintenance command. It
loads `TEST_DATABASE_URL`, parses the PostgreSQL target, and refuses to operate
unless the database name is exactly `securenet_test`. It deletes Sprint 3 Event,
Alert, and rule rows plus Sprint 5/6 run, position, and setting rows in safe
foreign-key order before the existing test data, then runs the deterministic
idempotent seed.

```bash
npm run db:test:reset
```

The script must never be repurposed for development or production databases.

`npm run simulation:worker` starts the independent single-instance Demo
simulation worker. It uses a PostgreSQL advisory lock, fails orphaned runs on
restart, and does not expose credentials. `npm run start:test-runtime` is for
Playwright only and starts the production web process plus worker against the
guarded test environment.

There is no product Demo reset, purge, pause, resume, speed, cron, queue, or Redis
command.

`npm run db:production:bootstrap` is an explicit one-time, empty-only production
Demo bootstrap. It requires positive environment/database identity and an
authorization flag, refuses any operational data, and never calls the test reset.

`npm run db:portfolio:bootstrap` is the separate manual Neon portfolio
bootstrap. It requires portfolio mode, an explicitly authorized database name,
and a Neon host; it refuses any existing application data and is never part of a
build or start command.

`npm run backup:verify-restore` performs read-only counts and migration inspection
against a positively identified isolated restore. It refuses development, test,
default, template, or live-equal targets and does not restore or delete.

`npm run smoke:production` requires an HTTPS or loopback target and a private
operator password. It checks health, Viewer authentication, private-role
rejection, protected modules, CSV, and simulation reads without printing secrets.
