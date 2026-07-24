# Approved product scope

## Product

SecureNet is a simulated, portfolio-grade Network Monitoring Center. It presents a
unified operational view of device state, performance measurements, rule-based
alerts, an append-only event history, network relationships, and a deterministic
simulation environment. Its purpose is to demonstrate product, network, full-stack,
database, security, testing, realtime, and operations engineering without claiming
to monitor real infrastructure.

## Users

- Administrator: manages devices, users, settings, alert rules, and simulation.
- Network Engineer: monitors health, diagnoses devices, and acknowledges or resolves
  alerts.
- Viewer: reads dashboards, devices, topology, and reports without mutation rights.

## Version 1.0 capability boundary

The approved product includes Dashboard, Devices, Device Details, Alerts, Events,
Topology, basic identity and role enforcement, reports/settings at lower priority,
PostgreSQL-backed APIs, deterministic simulated telemetry, Network Health Score,
realtime or near-realtime updates, responsive dark UI, tests, deployment, and
portfolio evidence.

The release excludes real SNMP/WMI/SSH/agent monitoring, automatic discovery, remote
device configuration, a full ITSM ticketing system, a native mobile application,
paid/SMS integrations, production AI analytics, commercial multi-tenancy, and a
commercial SLA.

## P0 page surface under governing precedence

DOC-001 is the governing source and classifies these pages P0:

1. Dashboard
2. Devices
3. Device Details
4. Alerts
5. Topology
6. Events

Login, Reports, Users & Roles, and Settings are P1 in DOC-001. DOC-002 conflicts by
classifying Login P0; the implementation consequence is recorded in
`IMPLEMENTATION_ASSUMPTIONS.md`.

## Non-negotiable quality

- Simulated data is visibly identified.
- Every screen has loading, empty, error, and permission-denied handling as
  applicable.
- The interface works from 320 px through wide desktop layouts.
- Keyboard navigation, visible focus, meaningful labels, non-color status cues, and
  WCAG AA contrast are release requirements.
- TypeScript is strict, lint is warning-free, secrets stay outside Git, and domain
  rules remain outside presentation components.
- No feature is presented as production-ready before it is implemented and tested.
