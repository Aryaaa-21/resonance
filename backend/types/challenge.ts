import type { ProtocolMetadata } from "./protocol";
import type { EntityId } from "./shared";
import type { ChallengeStatus, SimulationMetadata } from "./status";

export type ChallengeReason =
  | "insufficient_evidence"
  | "conflicting_observation"
  | "suspected_fraud"
  | "late_submission"
  | "duplicate_claim";

export type ChallengeResolution = "upheld" | "dismissed" | "withdrawn";

export interface Challenge {
  readonly protocol?: ProtocolMetadata;
  readonly id: EntityId;
  readonly eventId: EntityId;
  readonly raisedBy: EntityId;
  readonly reason: ChallengeReason;
  readonly description: string;
  readonly stakeAmount: number;
  readonly stakeSymbol: string;
  readonly stakeReference: string | null;
  readonly status: ChallengeStatus;
  readonly createdAt: string;
  readonly reviewDeadline: string;
  readonly resolvedAt: string | null;
  readonly resolution: ChallengeResolution | null;
  readonly simulation?: SimulationMetadata;
}

export interface ChallengeQuery {
  readonly eventId?: EntityId;
  readonly status?: ChallengeStatus;
  readonly limit?: number;
}
