import { ReportService } from "@/modules/reporting/application/report-service";
import { PrismaReportRepository } from "@/modules/reporting/infrastructure/prisma-report-repository";

export const reportService = new ReportService(new PrismaReportRepository());
