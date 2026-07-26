# Testing and database safety

Run static, unit/integration/component, build, and browser gates:

```bash
npm run format:check
npm run lint
npm run type-check
npm run prisma:validate
npm run prisma:generate
npm run db:migrate:deploy
npm test
npm run build
npm run test:e2e
npm audit
```

Database tests load `TEST_DATABASE_URL` and replace `DATABASE_URL` only after
positive validation that the database name is exactly `securenet_test`.
`npm run db:test:reset` refuses development and unknown database targets. Never
print connection URLs in evidence.

Sprint 3 coverage includes pure rule boundaries, duration and consecutive
conditions, exclusions, lifecycle/RBAC, actor/timestamp/note persistence,
transaction rollback, active deduplication under concurrency, Alert pagination
and filtering, Event cursor/filter/search, malformed inputs, related-device
history, archive preservation, idempotent seed/migration checks, desktop and
320-pixel mobile flows, and axe WCAG A/AA checks. Browser tests run serially
against a freshly reset `securenet_test`.
