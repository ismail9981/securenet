import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import type {
  AlertsCsvResult,
  NetworkHealthReport,
} from "@/modules/reporting/application/report-contracts";
import type { ReportFilters } from "@/modules/reporting/domain/report-filters";

export interface ReportRepository {
  networkHealth(filters: ReportFilters): Promise<NetworkHealthReport>;
  alertsCsv(
    filters: ReportFilters,
    context: DeviceMutationContext,
  ): Promise<AlertsCsvResult>;
}
