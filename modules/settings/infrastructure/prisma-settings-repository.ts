import { prisma } from "@/lib/prisma";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import type { SettingsRepository } from "@/modules/settings/application/settings-repository";
import {
  systemSettingSchema,
  type SystemSettingView,
  type UpdateSystemSetting,
} from "@/modules/settings/domain/settings";

const defaults = {
  id: "global",
  timezone: "Asia/Muscat",
  cpuUnit: "percent",
  memoryUnit: "percent",
  trafficUnit: "Mbps",
} as const;

function view(value: {
  timezone: string;
  cpuUnit: string;
  memoryUnit: string;
  trafficUnit: string;
  updatedAt: Date;
}): SystemSettingView {
  return systemSettingSchema.parse({
    ...value,
    updatedAt: value.updatedAt.toISOString(),
  });
}

export class PrismaSettingsRepository implements SettingsRepository {
  async get(): Promise<SystemSettingView> {
    const setting = await prisma.systemSetting.findUniqueOrThrow({
      where: { id: "global" },
    });
    return view(setting);
  }

  async update(
    input: UpdateSystemSetting,
    context: DeviceMutationContext,
  ): Promise<SystemSettingView> {
    return prisma.$transaction(async (transaction) => {
      const before = await transaction.systemSetting.upsert({
        where: { id: "global" },
        update: {},
        create: defaults,
      });
      const after = await transaction.systemSetting.update({
        where: { id: "global" },
        data: { ...input, updatedById: context.actor.id },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: context.actor.id,
          action: "settings.updated",
          entityType: "SystemSetting",
          entityId: "global",
          beforeData: {
            timezone: before.timezone,
            cpuUnit: before.cpuUnit,
            memoryUnit: before.memoryUnit,
            trafficUnit: before.trafficUnit,
          },
          afterData: input,
          ipAddress: context.requestIp,
        },
      });
      return view(after);
    });
  }
}
