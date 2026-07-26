import type { ActorContext } from "@/modules/identity/application/authorize";
import type {
  CreateDeviceInput,
  DeviceListQuery,
  MetricCursorQuery,
  UpdateDeviceInput,
} from "@/modules/inventory/domain/device";
import type {
  DeviceDetails,
  DevicePage,
  LocationOption,
  MetricPage,
} from "@/modules/inventory/application/device-contracts";

export interface DeviceMutationContext extends ActorContext {
  readonly requestIp: string | null;
}

export interface DeviceRepository {
  list(query: DeviceListQuery): Promise<DevicePage>;
  listLocations(): Promise<readonly LocationOption[]>;
  getById(id: string): Promise<DeviceDetails | null>;
  getMetrics(id: string, query: MetricCursorQuery): Promise<MetricPage | null>;
  create(
    input: CreateDeviceInput,
    context: DeviceMutationContext,
  ): Promise<DeviceDetails>;
  update(
    id: string,
    input: UpdateDeviceInput,
    context: DeviceMutationContext,
  ): Promise<DeviceDetails>;
  archive(
    id: string,
    context: DeviceMutationContext,
  ): Promise<{ readonly id: string; readonly archivedAt: string }>;
}
