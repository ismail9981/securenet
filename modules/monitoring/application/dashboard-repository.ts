import type { DashboardSnapshot } from "@/modules/monitoring/application/dashboard-contracts";

export interface DashboardRepository {
  getSnapshot(): Promise<DashboardSnapshot>;
}
