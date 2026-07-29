import type {
  AlertRuleAdminView,
  UpdateAlertRuleInput,
} from "@/modules/alerting/domain/alert-rule-admin";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";

export interface AlertRuleAdminRepository {
  list(): Promise<readonly AlertRuleAdminView[]>;
  update(
    id: string,
    input: UpdateAlertRuleInput,
    context: DeviceMutationContext,
  ): Promise<AlertRuleAdminView>;
}
