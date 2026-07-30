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

## Sprint 6 administration

The Settings page changes one global presentation-only configuration row and
bounded fields on existing AlertRules. Only Administrators may save settings,
rules, or topology positions. Alerts CSV is available to every authenticated
role. These operations append AuditLog actions; they do not create operational
Events.

Migration `20260729100000_sprint_6_reports_settings_positions` is additive. It
adds the global setting and saved-position tables without deleting or rewriting
Device, Metric, Alert, Event, AuditLog, NetworkConnection, or SimulationRun
history. Apply it with the normal migration deployment command after positively
identifying the selected database.

## Safe operation

- Never point reset tooling at development; it accepts only `securenet_test`.
- Do not run two workers intentionally.
- Do not delete Metrics, Events, Alerts, AuditLog, connections, or runs.
- Use the Administrator Dashboard control to start, inspect, or cancel a run.
- Recovery is a scenario, not Alert auto-resolution.
- AR-BW-01 remains disabled.
- No product Demo reset, user-management, pause, resume, speed, purge, queue,
  Redis, or PDF-generation facility exists.

If the worker exits unexpectedly, restart it once. The new owner records
orphaned runs as failed and exposes the result through the run-status API.

## Sprint 7 release operations

Use `DEPLOYMENT.md` and `BACKUP_RESTORE.md`. Render runs exactly one Web and one
Worker, with automatic deploys off. The Web pre-deploy phase alone runs
`prisma migrate deploy`; `/api/health/ready` is the health path.

`npm run db:production:bootstrap` is a separately authorized empty-only operator
action. It refuses non-production Demo environments, missing flags, mismatched or
reserved database names, and any operational row. It is not a reset or deploy
hook. `LOG_LEVEL` accepts `debug`, `info`, `warn`, or `error`; unknown values fall
back to `info`.
