# Project scripts

`reset-test-database.ts` is the only destructive maintenance command. It
loads `TEST_DATABASE_URL`, parses the PostgreSQL target, and refuses to operate
unless the database name is exactly `securenet_test`. It deletes Sprint 3 Event,
Alert, and rule rows in safe foreign-key order before the existing test data, then
runs the deterministic idempotent seed.

```bash
npm run db:test:reset
```

The script must never be repurposed for development or production databases.
Simulation remains unimplemented.
