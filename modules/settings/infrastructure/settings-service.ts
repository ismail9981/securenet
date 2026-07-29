import { SettingsService } from "@/modules/settings/application/settings-service";
import { PrismaSettingsRepository } from "@/modules/settings/infrastructure/prisma-settings-repository";

export const settingsService = new SettingsService(
  new PrismaSettingsRepository(),
);
