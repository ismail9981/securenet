# Project scripts

`reset-test-database.ts` is the only destructive Sprint 2 maintenance command. It
loads `TEST_DATABASE_URL`, parses the PostgreSQL target, and refuses to operate
unless the database name is exactly `securenet_test`. It truncates only the
approved Sprint 2 test tables and runs the deterministic seed.

```bash
npm run db:test:reset
```

The script must never be repurposed for development or production databases.
Simulation remains unimplemented.
