# Known and accepted limitations

- SecureNet is simulated Demo software, not real network monitoring.
- Authentication is a fixed Demo adapter with signed stateless sessions. There
  is no registration, recovery, revocation list, SSO, or user administration.
- Production exposes Viewer publicly; Administrator and Engineer are private.
- Web and Worker each run once. SSE fan-out and rate limits are process-local and
  non-durable; there is no horizontal scale or distributed coordination beyond
  the worker's PostgreSQL advisory lock.
- Dashboard trend is fixed at 24 hours. Device Details history is bounded from
  1 hour through 30 days.
- Health Score is partial and visibly disclosed. Packet-loss, ping, and
  degraded-device-ratio deductions remain undefined.
- AR-BW-01 stays disabled because bandwidth capacity/utilization is incomplete.
- Alerts never resolve automatically and do not recur/reopen automatically.
- AuditLog has no user-facing UI or public API.
- No PDF reports, incident overlay, Demo reset, user management, custom domain,
  or third-party monitoring exists.
- HSTS remains off pending validation of the final stable HTTPS domain policy.
