# Backup and isolated restore verification

Render continually protects paid PostgreSQL instances with point-in-time
recovery. The actual recovery window depends on the workspace plan and must be
copied from the Render Recovery page into release evidence; this repository does
not assume a duration. Render logical exports are retained by the provider for
seven days at the time of this runbook, so release evidence must re-confirm that
policy.

Before a critical release, record current PITR availability and create a logical
export in the Render Recovery page. Download and retain it according to the
project's approved secure storage policy. Never commit an export.

Test restoration only into a newly created, isolated empty database:

1. Restore the provider export into the isolated target, never the live database.
2. Set `RESTORE_DATABASE_URL` and the exact
   `RESTORE_EXPECTED_DATABASE_NAME` only in the operator shell.
3. Keep `DATABASE_URL` pointing to live solely so the helper can refuse equality.
4. Run `npm run backup:verify-restore`. It performs read-only row counts for
   Devices, Metrics, Alerts, Events, and AuditLog and checks applied migrations.
5. Compare counts with the pre-release manifest, run authenticated smoke tests
   against an isolated Web Service, and record discrepancies.
6. Delete the isolated service/database only after evidence is retained.

The helper refuses development, test, default, template, name-mismatched, and
live-equal targets. It does not run `pg_restore`, migrate, truncate, or delete.
Provider restore commands can be destructive and therefore remain manual.
