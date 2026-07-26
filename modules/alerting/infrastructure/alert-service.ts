import { AlertService } from "@/modules/alerting/application/alert-service";
import { PrismaAlertRepository } from "@/modules/alerting/infrastructure/prisma-alert-repository";

export const alertService = new AlertService(new PrismaAlertRepository());
