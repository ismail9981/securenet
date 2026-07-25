import {
  dashboardSnapshotSchema,
  type DashboardSnapshot,
} from "@/modules/monitoring/application/dashboard-contracts";
import type { DashboardRepository } from "@/modules/monitoring/application/dashboard-repository";
import { assertPermission } from "@/modules/identity/domain/permissions";
import type { UserRole } from "@/modules/shared/domain/network";

export async function getDashboardSnapshot(
  repository: DashboardRepository,
  actorRole: UserRole,
): Promise<DashboardSnapshot> {
  assertPermission(actorRole, "VIEW_DASHBOARD");
  return dashboardSnapshotSchema.parse(await repository.getSnapshot());
}
