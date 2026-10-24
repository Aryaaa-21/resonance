import {
  canonicalEvidence,
  canonicalObservation,
  evidenceCommitment,
  evidenceSetCommitment,
  observationCommitment,
  verifyWitnessSignature,
  witnessSignatureCommitment,
  witnessSignatureMessage,
} from "@/sdk/evidence";
import { commitmentToBytes } from "@/sdk/encoding";

export const PHASE4_CANONICALIZATION_VERSION = "resonance:evidence:v1";

export interface StoredEvidenceLike {
  readonly kind: string;
  readonly label: string;
  readonly description: string | null;
  readonly collectedAt: Date;
  readonly contentHash: string;
  readonly storageReference: string | null;
  readonly artifactRef?: string | null;
  readonly metadata: unknown;
  readonly evidenceCommitment?: string | null;
}

export interface StoredObservationLike {
  readonly eventId: string;
  readonly witnessId: string;
  readonly kind: string;
  readonly summary: string;
  readonly payload: unknown;
  readonly contentHash: string | null;
  readonly observedAt: Date;
  readonly observationCommitment?: string | null;
}

export function evidenceInput(record: StoredEvidenceLike) {
  return {
    kind: record.kind.toLowerCase(),
    label: record.label,
    description: record.description,
    collectedAt: record.collectedAt.toISOString(),
    contentHash: record.contentHash,
    storageReference: record.storageReference ?? record.artifactRef ?? null,
    metadata: record.metadata,
  };
}

export function observationInput(record: StoredObservationLike) {
  return {
    eventId: record.eventId,
    witnessId: record.witnessId,
    kind: record.kind.toLowerCase(),
    summary: record.summary,
    payload: record.payload,
    contentHash: record.contentHash,
    observedAt: record.observedAt.toISOString(),
  };
}

export async function buildEvidenceIntegrity(record: StoredEvidenceLike) {
  const result = await evidenceCommitment(evidenceInput(record));
  return { ...result, canonicalizationVersion: "resonance:evidence:v1" as const };
}

export async function buildObservationIntegrity(record: StoredObservationLike) {
  const result = await observationCommitment(observationInput(record));
  return { ...result, canonicalizationVersion: "resonance:observation:v1" as const };
}

export async function buildEvidenceSetIntegrity(records: readonly StoredEvidenceLike[]) {
  if (records.length === 0) throw new Error("At least one evidence record is required");
  const leaves = await Promise.all(records.map(buildEvidenceIntegrity));
  return { leaves, commitment: await evidenceSetCommitment(leaves.map((leaf) => leaf.commitment)) };
}

export interface AttestationIntegrityInput {
  readonly protocolEventNumber: bigint | number | string;
  readonly witnessOwner: string;
  readonly witnessId: string;
  readonly observation: StoredObservationLike;
  readonly evidence: readonly StoredEvidenceLike[];
  readonly expectedObservationCommitment: string;
  readonly expectedEvidenceCommitment: string;
  readonly witnessSignature: Uint8Array | string;
  readonly expectedWitnessSignatureCommitment: string;
}

export async function verifyAttestationIntegrity(input: AttestationIntegrityInput) {
  const reasons: string[] = [];
  const observation = await buildObservationIntegrity(input.observation);
  const evidence = await buildEvidenceSetIntegrity(input.evidence);
  const expectedObservation = commitmentToBytes(input.expectedObservationCommitment).toString("hex");
  const expectedEvidence = commitmentToBytes(input.expectedEvidenceCommitment).toString("hex");
  const expectedSignature = commitmentToBytes(input.expectedWitnessSignatureCommitment).toString("hex");

  if (observation.commitment !== expectedObservation) reasons.push("observation commitment does not match the attestation");
  if (input.observation.observationCommitment && input.observation.observationCommitment.replace(/^sha256:/i, "").toLowerCase() !== observation.commitment) reasons.push("observation metadata was modified after commitment");
  for (const [index, record] of input.evidence.entries()) {
    const leaf = evidence.leaves[index];
    if (record.evidenceCommitment && record.evidenceCommitment.replace(/^sha256:/i, "").toLowerCase() !== leaf.commitment) reasons.push(`evidence record ${index} metadata was modified after commitment`);
  }
  if (evidence.commitment !== expectedEvidence) reasons.push("evidence set commitment does not match the attestation");

  const message = witnessSignatureMessage({
    eventNumber: input.protocolEventNumber,
    witnessOwner: input.witnessOwner,
    witnessId: input.witnessId,
    observationCommitment: expectedObservation,
    evidenceCommitment: expectedEvidence,
  });
  const signatureValid = await verifyWitnessSignature({ witnessOwner: input.witnessOwner, message, signature: input.witnessSignature });
  const signatureCommitment = await witnessSignatureCommitment(input.witnessSignature);
  if (!signatureValid) reasons.push("witness signature is invalid for the committed message");
  if (signatureCommitment !== expectedSignature) reasons.push("witness signature commitment does not match the supplied signature");

  return {
    verified: reasons.length === 0,
    tampered: reasons.some((reason) => /modified|does not match/.test(reason)),
    evidenceVerified: evidence.commitment === expectedEvidence && input.evidence.every((record, index) => !record.evidenceCommitment || record.evidenceCommitment.replace(/^sha256:/i, "").toLowerCase() === evidence.leaves[index].commitment),
    observationVerified: observation.commitment === expectedObservation && (!input.observation.observationCommitment || input.observation.observationCommitment.replace(/^sha256:/i, "").toLowerCase() === observation.commitment),
    signatureVerified: signatureValid && signatureCommitment === expectedSignature,
    computed: { observationCommitment: observation.commitment, evidenceCommitment: evidence.commitment, witnessSignatureCommitment: signatureCommitment },
    reasons,
  };
}

export { canonicalEvidence, canonicalObservation };
