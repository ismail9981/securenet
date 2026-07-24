# Database boundary

DOC-005 approves PostgreSQL with Prisma and versioned migrations. Sprint 0 reserves
this boundary but intentionally does not add a schema, database client, migration,
seed, or runtime connection because production database integration is explicitly
out of scope.

The first persistence implementation must:

- use UUID public identifiers, UTC timestamps, and snake_case database names;
- preserve append-only metrics/events/audit records;
- implement documented unique and query indexes;
- validate every migration and document rollback or forward-fix;
- reconcile IA-003 before defining the Alert status enum.
