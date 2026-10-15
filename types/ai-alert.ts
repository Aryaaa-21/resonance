import type { EntityId } from "./shared";
import type { AIAlertSeverity, AIAlertStatus, SimulationMetadata } from "./status";

export type AIAlertType =
  | "anomaly"
  | "conflicting_signal"
  | "low_confidence"
  | "duplicate_signal"
  | "spoofing_risk";

export interface AIAlert {
  readonly id: EntityId;
  readonly eventId: EntityId;
  readonly type: AIAlertType;
  readonly severity: AIAlertSeverity;
  readonly status: AIAlertStatus;
  readonly title: string;
  readonly message: string;
  readonly modelName: string;
  readonly modelVersion: string;
  readonly modelConfidence: number;
  readonly detectedAt: string;
  readonly evidenceIds: readonly EntityId[];
  readonly recommendedAction: string;
  readonly simulation?: SimulationMetadata;
}

export interface AIAlertQuery {
  readonly eventId?: EntityId;
  readonly severity?: AIAlertSeverity;
  readonly status?: AIAlertStatus;
  readonly limit?: number;
}
