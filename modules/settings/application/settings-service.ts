import {
  authorizeActor,
  type ActorContext,
} from "@/modules/identity/application/authorize";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import type { SettingsRepository } from "@/modules/settings/application/settings-repository";
import type {
  SystemSettingView,
  UpdateSystemSetting,
} from "@/modules/settings/domain/settings";

export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  async get(context: ActorContext): Promise<SystemSettingView> {
    authorizeActor(context, "VIEW_SETTINGS");
    return this.repository.get();
  }

  async update(
    input: UpdateSystemSetting,
    context: DeviceMutationContext,
  ): Promise<SystemSettingView> {
    authorizeActor(context, "MANAGE_SETTINGS");
    return this.repository.update(input, context);
  }
}
