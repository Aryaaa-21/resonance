import type { EntityId } from "./shared";
import type { ProtocolMetadata } from "./protocol";
import type {
  AttestationPublicationState,
  AttestationStatus,
  SimulationMetadata,
  SupportedNetwork,
} from "./status";

export interface Attestation {
  readonly id: EntityId;
  readonly eventId: EntityId;
  readonly status: AttestationStatus;
  readonly publicationState: AttestationPublicationState;
  readonly network: SupportedNetwork;
  readonly programId: string;
  readonly commitment: string;
  readonly observationCommitment?: string | null;
  readonly evidenceCommitment?: string | null;
  readonly witnessPublicKey?: string | null;
  readonly witnessSignatureCommitment?: string | null;
  readonly integrityStatus?: "unverified" | "verified" | "tampered";
  readonly tamperDetected?: boolean;
  /** A local reference for UI simulation; it is not a transaction signature. */
  readonly simulatedReference: string;
  readonly createdAt: string;
  readonly simulatedAt: string | null;
  readonly simulation?: SimulationMetadata;
  readonly protocol?: ProtocolMetadata;
}
