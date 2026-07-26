import {
  authorizeActor,
  type ActorContext,
} from "@/modules/identity/application/authorize";
import type {
  DeviceDetails,
  DevicePage,
  LocationOption,
  MetricPage,
} from "@/modules/inventory/application/device-contracts";
import { DeviceNotFoundError } from "@/modules/inventory/application/device-errors";
import type {
  DeviceMutationContext,
  DeviceRepository,
} from "@/modules/inventory/application/device-repository";
import type {
  CreateDeviceInput,
  DeviceListQuery,
  MetricCursorQuery,
  UpdateDeviceInput,
} from "@/modules/inventory/domain/device";

export class DeviceService {
  constructor(private readonly repository: DeviceRepository) {}

  async list(
    query: DeviceListQuery,
    context: ActorContext,
  ): Promise<DevicePage> {
    authorizeActor(context, "VIEW_DEVICES");
    return this.repository.list(query);
  }

  async listLocations(
    context: ActorContext,
  ): Promise<readonly LocationOption[]> {
    authorizeActor(context, "VIEW_DEVICES");
    return this.repository.listLocations();
  }

  async getById(id: string, context: ActorContext): Promise<DeviceDetails> {
    authorizeActor(context, "VIEW_DEVICES");
    const device = await this.repository.getById(id);

    if (!device) {
      throw new DeviceNotFoundError();
    }

    return device;
  }

  async getMetrics(
    id: string,
    query: MetricCursorQuery,
    context: ActorContext,
  ): Promise<MetricPage> {
    authorizeActor(context, "VIEW_DEVICES");
    const metrics = await this.repository.getMetrics(id, query);

    if (!metrics) {
      throw new DeviceNotFoundError();
    }

    return metrics;
  }

  async create(
    input: CreateDeviceInput,
    context: DeviceMutationContext,
  ): Promise<DeviceDetails> {
    authorizeActor(context, "MANAGE_DEVICES");
    return this.repository.create(input, context);
  }

  async update(
    id: string,
    input: UpdateDeviceInput,
    context: DeviceMutationContext,
  ): Promise<DeviceDetails> {
    authorizeActor(context, "MANAGE_DEVICES");
    return this.repository.update(id, input, context);
  }

  async archive(
    id: string,
    _confirmed: true,
    context: DeviceMutationContext,
  ): Promise<{ readonly id: string; readonly archivedAt: string }> {
    authorizeActor(context, "MANAGE_DEVICES");
    return this.repository.archive(id, context);
  }
}
