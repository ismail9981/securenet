import type {
  RealtimeEnvelope,
  RealtimeEventInput,
} from "@/modules/realtime/application/realtime-contracts";

export interface RealtimePublisher {
  publish(input: RealtimeEventInput): RealtimeEnvelope;
}
