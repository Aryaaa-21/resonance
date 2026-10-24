import type { ProtocolMetadata } from "./protocol";
import type { EntityId, EventLocation, TokenAmount } from "./shared";
import type { SimulationMetadata, WitnessStatus } from "./status";

export type WitnessKind = "device" | "human" | "service" | "iot" | "ai_agent" | "external_system";

export interface Witness {
  readonly protocol?: ProtocolMetadata;
  readonly id: EntityId;
  readonly name: string;
  readonly kind: WitnessKind;
  readonly description: string;
  readonly location: EventLocation;
  readonly status: WitnessStatus;
  readonly reputationScore: number;
  readonly accuracyScore: number;
  readonly observedEventCount: number;
  readonly stake: TokenAmount;
  readonly lastSeenAt: string;
  readonly eventIds: readonly EntityId[];
  readonly simulation?: SimulationMetadata;
}

export interface WitnessQuery {
  readonly kind?: WitnessKind;
  readonly status?: WitnessStatus;
  readonly limit?: number;
}
