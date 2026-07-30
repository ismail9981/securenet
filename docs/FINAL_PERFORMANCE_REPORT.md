# Final performance report

Status: local engineering budgets passed; hosted evidence pending deployment.

Measured against local `securenet_test` on 2026-07-30:

- Initial Network Health Report: 566 ms (budget 3,000 ms).
- Filtered report P95 across 20 queries: 7 ms (budget 750 ms).
- 10,000-row formula-safe Alerts CSV: 1,940 ms (budget 5,000 ms).
- 30-day Device Metric query: 12 ms (budget 1,000 ms).
- Save 30 topology positions: 49 ms (budget 1,000 ms).

The production build completed successfully. These are local engineering results,
not hosted capacity, latency, Lighthouse, or scalability claims.
