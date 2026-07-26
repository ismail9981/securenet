import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import type {
  AcceptedMetricBatch,
  AlertLifecycleResult,
  AlertPage,
  AlertRecord,
  MetricBatchEvaluationResult,
} from "@/modules/alerting/application/alert-contracts";
import type {
  AcknowledgeAlertInput,
  AlertListQuery,
  ResolveAlertInput,
} from "@/modules/alerting/domain/alert";

export interface AlertRepository {
  list(query: AlertListQuery): Promise<AlertPage>;
  getById(id: string): Promise<AlertRecord | null>;
  listForDevice(deviceId: string, query: AlertListQuery): Promise<AlertPage>;
  acknowledge(
    id: string,
    input: AcknowledgeAlertInput,
    context: DeviceMutationContext,
  ): Promise<AlertLifecycleResult>;
  investigate(
    id: string,
    context: DeviceMutationContext,
  ): Promise<AlertLifecycleResult>;
  resolve(
    id: string,
    input: ResolveAlertInput,
    context: DeviceMutationContext,
  ): Promise<AlertLifecycleResult>;
  evaluateMetricBatch(
    batch: AcceptedMetricBatch,
  ): Promise<MetricBatchEvaluationResult>;
}
