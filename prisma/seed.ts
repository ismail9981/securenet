import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { config } from "dotenv";
import { pathToFileURL } from "node:url";

import {
  AlertMetric,
  AlertOperator,
  AlertSeverity,
  AlertSource,
  AlertStatus,
  DeviceStatus,
  DeviceType,
  EventType,
  NetworkConnectionStatus,
  NetworkConnectionType,
  PrismaClient,
  UserRole,
  UserStatus,
} from "../generated/prisma/client";
import { requireDatabaseUrl } from "../lib/database-url";
import { getDemoPassword } from "../modules/identity/infrastructure/demo-password";

config({ path: ".env.local", quiet: true });

const BCRYPT_COST = 12;
const METRIC_BATCH_KEY = "20000000-0000-4000-8000-000000000001";
const RULE_ID_PREFIX = "40000000-0000-4000-8000-";
const ALERT_ID_PREFIX = "50000000-0000-4000-8000-";
const DEMO_EVENT_PAYLOAD = { source: "DETERMINISTIC_DEMO_FIXTURE" } as const;

const auditUsers = [
  {
    id: "01f1c115-4481-4a6e-8d45-5b7510afbd1a",
    name: "Amina Al-Harthi",
    email: "admin@securenet.demo",
    role: UserRole.ADMIN,
  },
  {
    id: "6f3a8aa8-f6a1-4c24-9252-e49706dc973b",
    name: "Nasser Al-Balushi",
    email: "engineer@securenet.demo",
    role: UserRole.NETWORK_ENGINEER,
  },
  {
    id: "a8785311-78fa-4d3e-8f15-0511adb68597",
    name: "Maha Al-Rashdi",
    email: "viewer@securenet.demo",
    role: UserRole.VIEWER,
  },
] as const;

const locations = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Muscat Operations Center",
    description: "Primary simulated operations location.",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Branch Office",
    description: "Fictional branch network.",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "Data Room",
    description: "Simulated server and storage location.",
  },
] as const;

interface SeedDevice {
  readonly id: string;
  readonly name: string;
  readonly hostname: string;
  readonly ipAddress: string;
  readonly macAddress: string;
  readonly type: DeviceType;
  readonly status: DeviceStatus;
  readonly osName: string | null;
  readonly locationId: string;
  readonly parentDeviceId: string | null;
  readonly importanceWeight: number;
}

const deviceId = (index: number) =>
  `30000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

const connectionId = (index: number) =>
  `60000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

const devices: readonly SeedDevice[] = [
  {
    id: deviceId(1),
    name: "Security Firewall",
    hostname: "SEC-FW-01",
    ipAddress: "10.20.0.1",
    macAddress: "02:00:00:00:00:01",
    type: DeviceType.FIREWALL,
    status: DeviceStatus.ONLINE,
    osName: "SecureOS 12",
    locationId: locations[0].id,
    parentDeviceId: null,
    importanceWeight: 5,
  },
  {
    id: deviceId(2),
    name: "Core Router",
    hostname: "RTR-CORE-01",
    ipAddress: "10.20.0.2",
    macAddress: "02:00:00:00:00:02",
    type: DeviceType.ROUTER,
    status: DeviceStatus.OFFLINE,
    osName: "RouteOS 9",
    locationId: locations[0].id,
    parentDeviceId: deviceId(1),
    importanceWeight: 5,
  },
  {
    id: deviceId(3),
    name: "Branch Router",
    hostname: "RTR-BRANCH-01",
    ipAddress: "10.20.1.1",
    macAddress: "02:00:00:00:00:03",
    type: DeviceType.ROUTER,
    status: DeviceStatus.ONLINE,
    osName: "RouteOS 9",
    locationId: locations[1].id,
    parentDeviceId: deviceId(1),
    importanceWeight: 4,
  },
  ...Array.from({ length: 4 }, (_, offset): SeedDevice => {
    const index = offset + 4;
    return {
      id: deviceId(index),
      name: offset === 0 ? "Core Switch" : `Access Switch ${offset}`,
      hostname: offset === 0 ? "SW-CORE-01" : `SW-ACCESS-0${offset}`,
      ipAddress: `10.20.0.${index}`,
      macAddress: `02:00:00:00:00:${String(index).padStart(2, "0")}`,
      type: DeviceType.SWITCH,
      status: offset === 2 ? DeviceStatus.DEGRADED : DeviceStatus.ONLINE,
      osName: "SwitchOS 6",
      locationId: offset < 2 ? locations[0].id : locations[1].id,
      parentDeviceId: offset === 0 ? deviceId(2) : deviceId(4),
      importanceWeight: offset === 0 ? 5 : 3,
    };
  }),
  ...Array.from({ length: 4 }, (_, offset): SeedDevice => {
    const index = offset + 8;
    const hostnames = ["SRV-APP-01", "SRV-DB-01", "SRV-FILE-01", "SRV-WEB-01"];
    const names = [
      "Application Server",
      "Database Server",
      "File Server",
      "Web Server",
    ];
    return {
      id: deviceId(index),
      name: names[offset] ?? `Server ${offset + 1}`,
      hostname: hostnames[offset] ?? `SRV-0${offset + 1}`,
      ipAddress: `10.20.10.${offset + 10}`,
      macAddress: `02:00:00:00:00:${String(index).padStart(2, "0")}`,
      type: DeviceType.SERVER,
      status: offset === 0 ? DeviceStatus.DEGRADED : DeviceStatus.ONLINE,
      osName: offset === 1 ? "PostgreSQL Appliance" : "Linux LTS",
      locationId: locations[2].id,
      parentDeviceId: deviceId(4),
      importanceWeight: offset < 2 ? 5 : 4,
    };
  }),
  ...Array.from({ length: 3 }, (_, offset): SeedDevice => {
    const index = offset + 12;
    return {
      id: deviceId(index),
      name: `Office Access Point ${offset + 1}`,
      hostname: `AP-OFFICE-0${offset + 1}`,
      ipAddress: `10.20.20.${offset + 1}`,
      macAddress: `02:00:00:00:00:${String(index).padStart(2, "0")}`,
      type: DeviceType.AP,
      status: offset === 0 ? DeviceStatus.DEGRADED : DeviceStatus.ONLINE,
      osName: "WirelessOS 4",
      locationId: offset === 2 ? locations[1].id : locations[0].id,
      parentDeviceId: offset === 2 ? deviceId(6) : deviceId(5),
      importanceWeight: 2,
    };
  }),
  ...Array.from({ length: 12 }, (_, offset): SeedDevice => {
    const index = offset + 15;
    const department = ["FIN", "HR", "OPS", "ENG"][offset % 4] ?? "OPS";
    return {
      id: deviceId(index),
      name: `${department} Workstation ${Math.floor(offset / 4) + 1}`,
      hostname: `PC-${department}-0${Math.floor(offset / 4) + 1}`,
      ipAddress: `10.20.30.${offset + 10}`,
      macAddress: `02:00:00:00:00:${String(index).padStart(2, "0")}`,
      type: DeviceType.WORKSTATION,
      status:
        offset === 10
          ? DeviceStatus.OFFLINE
          : offset === 7
            ? DeviceStatus.DEGRADED
            : DeviceStatus.ONLINE,
      osName: "Workstation OS 11",
      locationId: offset >= 8 ? locations[1].id : locations[0].id,
      parentDeviceId: offset >= 8 ? deviceId(6) : deviceId(5),
      importanceWeight: 1,
    };
  }),
  ...Array.from({ length: 3 }, (_, offset): SeedDevice => {
    const index = offset + 27;
    return {
      id: deviceId(index),
      name: `Floor Printer ${offset + 1}`,
      hostname: `PRN-FLOOR${offset + 1}-01`,
      ipAddress: `10.20.40.${offset + 1}`,
      macAddress: `02:00:00:00:00:${String(index).padStart(2, "0")}`,
      type: DeviceType.PRINTER,
      status: DeviceStatus.ONLINE,
      osName: "Printer Firmware 3",
      locationId: offset === 2 ? locations[1].id : locations[0].id,
      parentDeviceId: offset === 2 ? deviceId(6) : deviceId(5),
      importanceWeight: 1,
    };
  }),
  {
    id: deviceId(30),
    name: "Backup NAS",
    hostname: "NAS-BACKUP-01",
    ipAddress: "10.20.10.30",
    macAddress: "02:00:00:00:00:30",
    type: DeviceType.NAS,
    status: DeviceStatus.ONLINE,
    osName: "StorageOS 8",
    locationId: locations[2].id,
    parentDeviceId: deviceId(4),
    importanceWeight: 4,
  },
];

const deviceById = new Map(devices.map((device) => [device.id, device]));
const networkConnections = devices
  .filter(
    (device): device is SeedDevice & { readonly parentDeviceId: string } =>
      device.parentDeviceId !== null,
  )
  .map((device, index) => {
    const source = deviceById.get(device.parentDeviceId);
    const connectionType =
      device.id === deviceId(3)
        ? NetworkConnectionType.VPN
        : NetworkConnectionType.ETHERNET;
    const status =
      source?.status === DeviceStatus.OFFLINE ||
      device.status === DeviceStatus.OFFLINE
        ? NetworkConnectionStatus.DOWN
        : source?.status === DeviceStatus.DEGRADED ||
            device.status === DeviceStatus.DEGRADED
          ? NetworkConnectionStatus.DEGRADED
          : NetworkConnectionStatus.ACTIVE;

    return {
      id: connectionId(index + 1),
      sourceDeviceId: device.parentDeviceId,
      targetDeviceId: device.id,
      connectionType,
      label: null,
      bandwidthCapacityMbps: null,
      status,
    };
  });

const ruleId = (index: number) =>
  `${RULE_ID_PREFIX}${String(index).padStart(12, "0")}`;

const alertId = (index: number) =>
  `${ALERT_ID_PREFIX}${String(index).padStart(12, "0")}`;

const alertRules = [
  {
    id: ruleId(1),
    code: "AR-CPU-01",
    name: "Critical CPU",
    metric: AlertMetric.CPU,
    operator: AlertOperator.GTE,
    warningThreshold: null,
    criticalThreshold: 90,
    durationSeconds: 60,
    consecutiveSamples: null,
    enabled: true,
  },
  {
    id: ruleId(2),
    code: "AR-RAM-01",
    name: "Critical RAM",
    metric: AlertMetric.RAM,
    operator: AlertOperator.GTE,
    warningThreshold: null,
    criticalThreshold: 92,
    durationSeconds: 60,
    consecutiveSamples: null,
    enabled: true,
  },
  {
    id: ruleId(3),
    code: "AR-DISK-01",
    name: "Critical disk usage",
    metric: AlertMetric.DISK,
    operator: AlertOperator.GTE,
    warningThreshold: null,
    criticalThreshold: 90,
    durationSeconds: 0,
    consecutiveSamples: null,
    enabled: true,
  },
  {
    id: ruleId(4),
    code: "AR-PING-01",
    name: "High ping",
    metric: AlertMetric.PING,
    operator: AlertOperator.GTE,
    warningThreshold: 120,
    criticalThreshold: null,
    durationSeconds: 0,
    consecutiveSamples: 3,
    enabled: true,
  },
  {
    id: ruleId(5),
    code: "AR-LOSS-01",
    name: "Critical packet loss",
    metric: AlertMetric.PACKET_LOSS,
    operator: AlertOperator.GTE,
    warningThreshold: null,
    criticalThreshold: 8,
    durationSeconds: 0,
    consecutiveSamples: 3,
    enabled: true,
  },
  {
    id: ruleId(6),
    code: "AR-OFFLINE-01",
    name: "Device offline",
    metric: AlertMetric.STATUS,
    operator: AlertOperator.EQ,
    warningThreshold: null,
    criticalThreshold: null,
    durationSeconds: 0,
    consecutiveSamples: 3,
    enabled: true,
  },
  {
    id: ruleId(7),
    code: "AR-BW-01",
    name: "High bandwidth utilization",
    metric: AlertMetric.BANDWIDTH,
    operator: AlertOperator.GTE,
    warningThreshold: 90,
    criticalThreshold: null,
    durationSeconds: 0,
    consecutiveSamples: null,
    enabled: false,
  },
] as const;

function metricValue(
  deviceIndex: number,
  hour: number,
  base: number,
  spread: number,
): number {
  return Number((base + ((deviceIndex * 7 + hour * 3) % spread)).toFixed(2));
}

export async function seedDatabase(client: PrismaClient): Promise<void> {
  const seededAt = new Date();
  seededAt.setUTCSeconds(0, 0);
  const passwordHash = await hash(getDemoPassword(), BCRYPT_COST);

  await client.$transaction(async (transaction) => {
    for (const user of auditUsers) {
      await transaction.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role,
          status: UserStatus.ACTIVE,
        },
        create: {
          ...user,
          passwordHash,
          status: UserStatus.ACTIVE,
        },
      });
    }

    for (const location of locations) {
      await transaction.location.upsert({
        where: { id: location.id },
        update: {
          name: location.name,
          description: location.description,
        },
        create: location,
      });
    }

    for (const device of devices) {
      await transaction.device.upsert({
        where: { id: device.id },
        update: {
          ...device,
          archivedAt: null,
          lastSeenAt: seededAt,
          metadata: { source: "DETERMINISTIC_DEMO_FIXTURE" },
        },
        create: {
          ...device,
          lastSeenAt: seededAt,
          metadata: { source: "DETERMINISTIC_DEMO_FIXTURE" },
        },
      });
    }

    for (const connection of networkConnections) {
      await transaction.networkConnection.upsert({
        where: { id: connection.id },
        update: connection,
        create: connection,
      });
    }

    await transaction.deviceMetric.deleteMany({
      where: { batchKey: METRIC_BATCH_KEY },
    });

    await transaction.deviceMetric.createMany({
      data: devices.flatMap((device, deviceOffset) =>
        Array.from({ length: 24 }, (_, hourOffset) => {
          const sourceTime = new Date(
            seededAt.getTime() - (23 - hourOffset) * 60 * 60 * 1000,
          );
          const offline = device.status === DeviceStatus.OFFLINE;
          const degraded = device.status === DeviceStatus.DEGRADED;

          return {
            deviceId: device.id,
            cpuPct: offline
              ? null
              : device.id === deviceId(8) &&
                  (hourOffset === 20 || hourOffset === 21)
                ? 94
                : metricValue(
                    deviceOffset,
                    hourOffset,
                    degraded ? 76 : 18,
                    degraded ? 14 : 42,
                  ),
            ramPct: offline
              ? null
              : metricValue(
                  deviceOffset,
                  hourOffset,
                  degraded ? 82 : 32,
                  degraded ? 10 : 38,
                ),
            diskPct: offline
              ? null
              : metricValue(deviceOffset, hourOffset, 38, 42),
            pingMs: offline
              ? null
              : metricValue(
                  deviceOffset,
                  hourOffset,
                  degraded ? 64 : 2,
                  degraded ? 48 : 24,
                ),
            packetLossPct: offline
              ? 100
              : device.id === deviceId(12) &&
                  hourOffset >= 19 &&
                  hourOffset <= 21
                ? 9 + ((hourOffset - 19) % 2)
                : metricValue(
                    deviceOffset,
                    hourOffset,
                    degraded ? 2.2 : 0,
                    degraded ? 5 : 2,
                  ),
            downloadMbps: offline
              ? 0
              : metricValue(deviceOffset, hourOffset, 12, 280),
            uploadMbps: offline
              ? 0
              : metricValue(deviceOffset, hourOffset, 4, 90),
            uptimeSeconds: offline
              ? null
              : BigInt(86_400 * (deviceOffset + 2) + hourOffset * 3_600),
            sourceTime,
            receivedAt: new Date(sourceTime.getTime() + 1_500),
            batchKey: METRIC_BATCH_KEY,
          };
        }),
      ),
    });

    for (const rule of alertRules) {
      await transaction.alertRule.upsert({
        where: { id: rule.id },
        update: {
          ...rule,
          scope: {},
        },
        create: {
          ...rule,
          scope: {},
        },
      });
    }

    const seededAlerts = [
      {
        id: alertId(1),
        deviceId: deviceId(2),
        alertRuleId: ruleId(6),
        dedupeKey: `${deviceId(2)}:${ruleId(6)}`,
        title: "Core router is offline",
        description:
          "The Core Router failed three consecutive response checks.",
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.OPEN,
        source: AlertSource.DEVICE_STATUS,
        openedAt: new Date(seededAt.getTime() - 46 * 60_000),
        acknowledgedAt: null,
        acknowledgedById: null,
        acknowledgementNote: null,
        assigneeUserId: null,
        resolvedAt: null,
        resolvedById: null,
        resolutionNote: null,
        lastTriggeredAt: new Date(seededAt.getTime() - 2 * 60_000),
      },
      {
        id: alertId(2),
        deviceId: deviceId(8),
        alertRuleId: ruleId(1),
        dedupeKey: `${deviceId(8)}:${ruleId(1)}`,
        title: "Application server CPU threshold exceeded",
        description:
          "CPU remained at or above 90% for the configured duration.",
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.ACKNOWLEDGED,
        source: AlertSource.METRIC_RULE,
        openedAt: new Date(seededAt.getTime() - 35 * 60_000),
        acknowledgedAt: new Date(seededAt.getTime() - 28 * 60_000),
        acknowledgedById: auditUsers[1].id,
        acknowledgementNote: "Reviewing the recent workload.",
        assigneeUserId: auditUsers[1].id,
        resolvedAt: null,
        resolvedById: null,
        resolutionNote: null,
        lastTriggeredAt: new Date(seededAt.getTime() - 20 * 60_000),
      },
      {
        id: alertId(3),
        deviceId: deviceId(12),
        alertRuleId: ruleId(5),
        dedupeKey: `${deviceId(12)}:${ruleId(5)}`,
        title: "Access point packet loss was critical",
        description: "Packet loss exceeded 8% for three consecutive readings.",
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.INVESTIGATING,
        source: AlertSource.METRIC_RULE,
        openedAt: new Date(seededAt.getTime() - 22 * 60_000),
        acknowledgedAt: new Date(seededAt.getTime() - 18 * 60_000),
        acknowledgedById: auditUsers[0].id,
        acknowledgementNote: "Checking wireless interference.",
        assigneeUserId: auditUsers[0].id,
        resolvedAt: null,
        resolvedById: null,
        resolutionNote: null,
        lastTriggeredAt: new Date(seededAt.getTime() - 12 * 60_000),
      },
      {
        id: alertId(4),
        deviceId: deviceId(10),
        alertRuleId: ruleId(3),
        dedupeKey: `${deviceId(10)}:${ruleId(3)}`,
        title: "File server disk threshold recovered",
        description: "Disk usage previously exceeded the critical threshold.",
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.RESOLVED,
        source: AlertSource.METRIC_RULE,
        openedAt: new Date(seededAt.getTime() - 6 * 60 * 60_000),
        acknowledgedAt: new Date(seededAt.getTime() - 5.75 * 60 * 60_000),
        acknowledgedById: auditUsers[1].id,
        acknowledgementNote: null,
        assigneeUserId: auditUsers[1].id,
        resolvedAt: new Date(seededAt.getTime() - 5 * 60 * 60_000),
        resolvedById: auditUsers[1].id,
        resolutionNote: "Temporary files were safely removed.",
        lastTriggeredAt: new Date(seededAt.getTime() - 5.5 * 60 * 60_000),
      },
    ] as const;

    for (const alert of seededAlerts) {
      await transaction.alert.upsert({
        where: { id: alert.id },
        update: alert,
        create: alert,
      });
    }

    await transaction.event.deleteMany({
      where: { payload: { equals: DEMO_EVENT_PAYLOAD } },
    });

    await transaction.event.createMany({
      data: [
        {
          deviceId: deviceId(2),
          alertId: alertId(1),
          type: EventType.DEVICE_STATUS_CHANGED,
          severity: AlertSeverity.CRITICAL,
          message: "RTR-CORE-01 changed from Online to Offline.",
          payload: DEMO_EVENT_PAYLOAD,
          createdAt: new Date(seededAt.getTime() - 47 * 60_000),
        },
        {
          deviceId: deviceId(2),
          alertId: alertId(1),
          type: EventType.ALERT_OPENED,
          severity: AlertSeverity.CRITICAL,
          message: "Critical offline Alert opened for RTR-CORE-01.",
          payload: DEMO_EVENT_PAYLOAD,
          createdAt: new Date(seededAt.getTime() - 46 * 60_000),
        },
        {
          deviceId: deviceId(8),
          alertId: alertId(2),
          type: EventType.ALERT_ACKNOWLEDGED,
          severity: AlertSeverity.INFO,
          message: "Nasser Al-Balushi acknowledged the CPU Alert.",
          actorUserId: auditUsers[1].id,
          payload: DEMO_EVENT_PAYLOAD,
          createdAt: new Date(seededAt.getTime() - 28 * 60_000),
        },
        {
          deviceId: deviceId(12),
          alertId: alertId(3),
          type: EventType.ALERT_INVESTIGATION_STARTED,
          severity: AlertSeverity.INFO,
          message: "Investigation started for the packet-loss Alert.",
          actorUserId: auditUsers[0].id,
          payload: DEMO_EVENT_PAYLOAD,
          createdAt: new Date(seededAt.getTime() - 16 * 60_000),
        },
        {
          deviceId: deviceId(10),
          alertId: alertId(4),
          type: EventType.ALERT_RESOLVED,
          severity: AlertSeverity.INFO,
          message: "File server disk Alert resolved.",
          actorUserId: auditUsers[1].id,
          payload: DEMO_EVENT_PAYLOAD,
          createdAt: new Date(seededAt.getTime() - 5 * 60 * 60_000),
        },
      ],
    });
  });
}

async function main(): Promise<void> {
  const adapter = new PrismaPg({
    connectionString: requireDatabaseUrl(),
  });
  const client = new PrismaClient({ adapter });

  try {
    await seedDatabase(client);
  } finally {
    await client.$disconnect();
  }
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await main();
}
