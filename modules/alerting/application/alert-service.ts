import {
  authorizeActor,
  type ActorContext,
} from "@/modules/identity/application/authorize";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import type {
  AcceptedMetricBatch,
  AlertLifecycleResult,
  AlertPage,
  AlertRecord,
  MetricBatchEvaluationResult,
} from "@/modules/alerting/application/alert-contracts";
import { AlertNotFoundError } from "@/modules/alerting/application/alert-errors";
import type { AlertRepository } from "@/modules/alerting/application/alert-repository";
import type {
  AcknowledgeAlertInput,
  AlertListQuery,
  ResolveAlertInput,
} from "@/modules/alerting/domain/alert";

export class AlertService {
  constructor(private readonly repository: AlertRepository) {}

  async list(query: AlertListQuery, context: ActorContext): Promise<AlertPage> {
    authorizeActor(context, "VIEW_ALERTS");
    return this.repository.list(query);
  }

  async getById(id: string, context: ActorContext): Promise<AlertRecord> {
    authorizeActor(context, "VIEW_ALERTS");
    const alert = await this.repository.getById(id);
    if (!alert) throw new AlertNotFoundError();
    return alert;
  }

  async listForDevice(
    deviceId: string,
    query: AlertListQuery,
    context: ActorContext,
  ): Promise<AlertPage> {
    authorizeActor(context, "VIEW_ALERTS");
    return this.repository.listForDevice(deviceId, query);
  }

  async acknowledge(
    id: string,
    input: AcknowledgeAlertInput,
    context: DeviceMutationContext,
  ): Promise<AlertLifecycleResult> {
    authorizeActor(context, "ACKNOWLEDGE_ALERTS");
    return this.repository.acknowledge(id, input, context);
  }

  async investigate(
    id: string,
    context: DeviceMutationContext,
  ): Promise<AlertLifecycleResult> {
    authorizeActor(context, "ACKNOWLEDGE_ALERTS");
    return this.repository.investigate(id, context);
  }

  async resolve(
    id: string,
    input: ResolveAlertInput,
    context: DeviceMutationContext,
  ): Promise<AlertLifecycleResult> {
    authorizeActor(context, "ACKNOWLEDGE_ALERTS");
    return this.repository.resolve(id, input, context);
  }

  async evaluateAcceptedMetricBatch(
    batch: AcceptedMetricBatch,
  ): Promise<MetricBatchEvaluationResult> {
    return this.repository.evaluateMetricBatch(batch);
  }
}
