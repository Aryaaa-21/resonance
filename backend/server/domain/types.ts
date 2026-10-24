export const EVENT_STATES = ["unverified", "review", "verified", "challenged", "rejected"] as const;
export type EventState = (typeof EVENT_STATES)[number];

export const EVENT_LIFECYCLE_STATUSES = [
  "draft",
  "pending",
  "active",
  "processing",
  "completed",
  "failed",
  "archived",
] as const;
export type EventLifecycleStatus = (typeof EVENT_LIFECYCLE_STATUSES)[number];

export const USER_ROLES = ["REQUESTER", "WITNESS", "STAKER", "DEVELOPER", "ADMIN", "REVIEWER", "SERVICE", "USER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const EVENT_CATEGORIES = [
  "LOGISTICS",
  "LOCATION",
  "IDENTITY",
  "ENVIRONMENTAL",
  "SECURITY",
  "OTHER",
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export interface Actor {
  readonly id: string;
  readonly role: UserRole;
  readonly email?: string;
  readonly displayName?: string;
}

export interface EventEvidenceSignal {
  readonly confidence: number;
  readonly status?: string;
  readonly witnessId?: string | null;
}

export interface ConfidenceInput {
  readonly observations: readonly EventEvidenceSignal[];
  readonly evidence: readonly EventEvidenceSignal[];
}

export interface ConfidenceResult {
  readonly score: number;
  readonly observationScore: number;
  readonly evidenceScore: number;
  readonly witnessDiversity: number;
  readonly rationale: readonly string[];
}

export interface ProtocolPublicationRequest {
  readonly eventId: string;
  readonly commitment: string;
  readonly network: string;
  readonly programId: string;
}

export interface ProtocolPublicationResult {
  readonly status: "simulated" | "not_submitted";
  /** A local adapter reference only; this is never a transaction signature. */
  readonly adapterReference: string | null;
  readonly isSimulation: true;
  readonly notice: string;
}
