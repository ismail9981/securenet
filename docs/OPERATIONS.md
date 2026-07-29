# SecureNet Demo operations

## Web and simulation processes

After applying migrations and seeding the selected database, run the production
web process and the independent single-instance simulation worker:

```bash
npm run build
npm run start
npm run simulation:worker
```

The worker uses `DATABASE_URL` without printing it. It attempts the SecureNet
PostgreSQL advisory lock and exits if another worker owns it. On successful
ownership it marks orphaned `RUNNING` rows `FAILED` with
`WORKER_RESTART_RECOVERY`; it never silently resumes them.

The worker cycles every five seconds, persists normal metric batches every
60 seconds plus important transition checkpoints, and bridges committed compact
signals to the web SSE hub through PostgreSQL `LISTEN/NOTIFY`.

## Safe operation

- Never point reset tooling at development; it accepts only `securenet_test`.
- Do not run two workers intentionally.
- Do not delete Metrics, Events, Alerts, AuditLog, connections, or runs.
- Use the Administrator Dashboard control to start, inspect, or cancel a run.
- Recovery is a scenario, not Alert auto-resolution.
- AR-BW-01 remains disabled.
- No reset, pause, resume, speed, purge, queue, Redis, or production monitoring
  facility exists in Sprint 5.

If the worker exits unexpectedly, restart it once. The new owner records
orphaned runs as failed and exposes the result through the run-status API.
