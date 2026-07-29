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
