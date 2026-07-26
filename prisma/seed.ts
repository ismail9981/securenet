import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { config } from "dotenv";
import { pathToFileURL } from "node:url";

import {
  DeviceStatus,
  DeviceType,
  PrismaClient,
  UserRole,
  UserStatus,
} from "../generated/prisma/client";
import { requireDatabaseUrl } from "../lib/database-url";
import { getDemoPassword } from "../modules/identity/infrastructure/demo-password";

config({ path: ".env.local", quiet: true });

const BCRYPT_COST = 12;
const METRIC_BATCH_KEY = "20000000-0000-4000-8000-000000000001";

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
