# Release checklist

## Sprint 7 approval and v0.7.0

- [ ] All local validation gates pass with exact totals.
- [ ] No blocker or critical defect is open.
- [ ] Accepted v1 limitations are approved.
- [ ] No secrets or private identities appear in Git/client output.
- [ ] Product Owner approves creation of `v0.7.0`.

## Deployment and hosted proof

- [ ] GitHub `production` environment requires manual review.
- [ ] Render Blueprint review confirms one Web, one Worker, paid PostgreSQL,
      disabled automatic deployment, private database access, and readiness path.
- [ ] Provider recovery window is recorded from the selected workspace.
- [ ] Pre-release restore point and logical export exist.
- [ ] Migration deploy and status pass.
- [ ] HTTPS, secure cookies, origin checks, health, logs, and platform alerts pass.
- [ ] Viewer works publicly; private roles remain rejected publicly.
- [ ] Authenticated page/API, CSV, simulation, worker, and SSE smoke tests pass.
- [ ] Isolated restore and history/count comparison pass.
- [ ] Hosted accessibility and performance evidence is captured.

## v1.0.0 boundary

- [ ] Portfolio assets are actual, not placeholders.
- [ ] Live URL and repository link are verified.
- [ ] Product Owner gives a separate Go decision.
- [ ] Only then create `v1.0.0` and the final release.
