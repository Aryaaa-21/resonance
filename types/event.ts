import type { ProtocolMetadata } from "./protocol";
import type { EntityId, EventLocation } from "./shared";
import type { LifecycleStatus, SimulationMetadata, VerificationState } from "./status";

export type EventCategory =
  | "logistics"
  | "location"
  | "identity"
  | "environmental"
  | "security"
  | "other";

export type EventType = "delivery" | "location_arrival";
export type SecurityLevel = "standard" | "elevated" | "high" | "critical";

export interface Event {
  readonly id: EntityId;
  readonly title: string;
  readonly description: string;
  readonly category: EventCategory;
  readonly eventType?: EventType;
  readonly location: EventLocation;
  /** ISO 8601 timestamp supplied by the reporting source. */
  readonly occurredAt: string;
  /** ISO 8601 timestamp for the mock registry write. */
  readonly reportedAt: string;
  readonly status: LifecycleStatus;
  readonly state: VerificationState;
  /** Confidence is a presentation-safe score from 0 to 100. */
  readonly confidence: number;
  readonly witnessIds: readonly EntityId[];
  readonly evidenceIds: readonly EntityId[];
  readonly challengeIds: readonly EntityId[];
  readonly aiAlertIds: readonly EntityId[];
  readonly attestationId: EntityId | null;
  readonly requestedBy: string | null;
  readonly simulation?: SimulationMetadata;
  readonly protocol?: ProtocolMetadata;
}

export interface EventQuery {
  readonly category?: EventCategory;
  readonly status?: LifecycleStatus;
  readonly state?: VerificationState;
  readonly limit?: number;
}

export interface CreateVerificationRequestInput {
  readonly title: string;
  readonly category: EventCategory;
  readonly eventType?: EventType;
  readonly location: EventLocation;
  readonly description?: string;
  readonly requiredWitnesses?: number;
  readonly deadline?: string;
  readonly securityLevel?: SecurityLevel;
  /** Application-only planning metadata; it does not move funds or create a protocol account. */
  readonly planningStakeAmount?: number;
  readonly confidenceThreshold?: number;
  readonly preferredWitnessClasses?: readonly string[];
  readonly occurredAt?: string;
  readonly requestedBy?: string | null;
}
