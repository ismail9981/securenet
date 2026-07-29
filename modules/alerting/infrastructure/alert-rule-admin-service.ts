import { AlertRuleAdminService } from "@/modules/alerting/application/alert-rule-admin-service";
import { PrismaAlertRuleAdminRepository } from "@/modules/alerting/infrastructure/prisma-alert-rule-admin-repository";

export const alertRuleAdminService = new AlertRuleAdminService(
  new PrismaAlertRuleAdminRepository(),
);
