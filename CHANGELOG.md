# Changelog

All notable changes to SecureNet are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project intends to
use semantic versioning once releases begin.

## [Unreleased]

### Fixed

- Removed the redundant focusable Recharts accessibility layer from the decorative
  traffic SVG; the equivalent textual traffic summary remains available to
  assistive technology.
- Pinned the patched `minimatch` transitive version used by ESLint tooling,
  clearing the current high-severity denial-of-service advisory chain.

### Added

- Sprint 1 server-only Demo identity adapter with deterministic Administrator,
  Network Engineer, and Viewer accounts.
- bcrypt password verification, JOSE-signed HttpOnly sessions, bounded login
  validation, generic failure responses, Demo rate limiting, and redacted
  structured authentication logs.
- Exact `/api/v1/auth/login`, `/logout`, and `/me` routes with authoritative
  server verification and application-level permission assertions.
- Deterministic Dashboard KPIs, device distribution, traffic trend, linked fixture
  alerts/events, loading/error/empty states, and explicit simulation disclosures.
- Documented Network Health Score boundaries and fixed deductions, with unresolved
  formula factors surfaced rather than inferred.
- Identity/domain/application/integration/component/browser/accessibility test
  coverage and security response headers.
- ADR-0002 and updated assumptions, roadmap, traceability, environment, and Sprint
  1 completion records.
- Sprint 0 Next.js, React, strict TypeScript, Tailwind CSS, ESLint, and Prettier
  foundation.
- Responsive application shell with desktop navigation and mobile drawer.
- Clearly labeled placeholders for the DOC-001 P0 route set.
- Shared loading, error, not-found, and empty-state foundations.
- Dark operational design tokens, focus treatment, and reduced-motion support.
- Core documented network enums and Zod schemas.
- Vitest unit-test and Playwright end-to-end foundations.
- Environment template, Git ignore rules, development scripts, baseline document
  copies, requirements tracker, roadmap, ADR, and Sprint 0 report.

[Unreleased]: https://github.com/example/securenet/compare/HEAD...HEAD
