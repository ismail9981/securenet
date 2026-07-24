# Logical module boundary

SecureNet is a modular monolith. Product modules will live below this directory as
`identity`, `inventory`, `telemetry`, `monitoring`, `alerting`, `event-log`,
`topology`, `simulation`, and `reporting`.

Each implemented module follows the approved dependency direction:

1. `domain/` — entities, value objects, and pure rules.
2. `application/` — use cases, DTOs, and ports.
3. `infrastructure/` — repositories and external adapters.
4. `presentation/` — route-facing components, hooks, and handlers.
5. `tests/` — module integration fixtures where colocated tests are insufficient.

Only `shared/domain` exists in Sprint 0 because no product use case or adapter is
implemented yet.
