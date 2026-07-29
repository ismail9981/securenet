import {
  authorizeActor,
  type ActorContext,
} from "@/modules/identity/application/authorize";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import type {
  AlertsCsvResult,
  NetworkHealthReport,
} from "@/modules/reporting/application/report-contracts";
import type { ReportRepository } from "@/modules/reporting/application/report-repository";
import type { ReportFilters } from "@/modules/reporting/domain/report-filters";

export class ReportService {
  constructor(private readonly repository: ReportRepository) {}

  networkHealth(
    filters: ReportFilters,
    context: ActorContext,
  ): Promise<NetworkHealthReport> {
    authorizeActor(context, "VIEW_REPORTS");
    return this.repository.networkHealth(filters);
  }

  alertsCsv(
    filters: ReportFilters,
    context: DeviceMutationContext,
  ): Promise<AlertsCsvResult> {
    authorizeActor(context, "VIEW_REPORTS");
    return this.repository.alertsCsv(filters, context);
  }
}
