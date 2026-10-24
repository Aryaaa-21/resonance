import type { EntityId } from "./shared";
import type { EvidenceStatus, SimulationMetadata } from "./status";

export type EvidenceKind = "location" | "image" | "signature" | "sensor" | "analysis";

export interface Evidence {
  readonly id: EntityId;
  readonly eventId: EntityId;
  readonly witnessId: EntityId;
  readonly kind: EvidenceKind;
  readonly label: string;
  readonly description: string;
  readonly collectedAt: string;
  readonly hash: string;
  readonly canonicalizationVersion?: string | null;
  readonly evidenceCommitment?: string | null;
  readonly integrityStatus?: "unverified" | "verified" | "tampered";
  readonly integrityVerifiedAt?: string | null;
  readonly status: EvidenceStatus;
  readonly confidence: number;
  /** Mock-only reference; no real artifact is fetched by this Phase 1 layer. */
  readonly artifactRef: string;
  readonly simulation: SimulationMetadata;
}
