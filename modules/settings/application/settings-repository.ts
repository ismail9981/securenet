import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import type {
  SystemSettingView,
  UpdateSystemSetting,
} from "@/modules/settings/domain/settings";

export interface SettingsRepository {
  get(): Promise<SystemSettingView>;
  update(
    input: UpdateSystemSetting,
    context: DeviceMutationContext,
  ): Promise<SystemSettingView>;
}
