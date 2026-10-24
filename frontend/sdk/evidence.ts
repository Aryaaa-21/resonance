import { PublicKey } from "@solana/web3.js";

export const EVIDENCE_CANONICALIZATION_VERSION = "resonance:evidence:v1" as const;
export const OBSERVATION_CANONICALIZATION_VERSION = "resonance:observation:v1" as const;
export const WITNESS_SIGNATURE_VERSION = "resonance:witness-signature:v1" as const;
export const INTEGRITY_RECEIPT_VERSION = "resonance:integrity:v1" as const;

export type CanonicalJsonValue = null | boolean | number | string | CanonicalJsonValue[] | { readonly [key: string]: CanonicalJsonValue };

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

/**
 * Deterministic JSON serialization for protocol metadata. Objects are sorted by
 * UTF-16 code-unit key order, arrays preserve order, and non-finite numbers are
 * rejected instead of being silently coerced. Raw artifacts never enter this
 * representation; callers provide their already-computed content hash.
 */
export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Canonical JSON does not permit non-finite numbers");
    return JSON.stringify(value);
  }
  if (typeof value === "bigint") throw new Error("Canonical JSON does not permit bigint values");
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  if (isPlainRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
  }
  if (value === undefined) throw new Error("Canonical JSON does not permit undefined values");
  throw new Error("Canonical JSON only accepts JSON values");
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function bytesToHex(value: Uint8Array): string {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(value: string, label = "value"): Uint8Array {
  const normalized = value.replace(/^0x/i, "");
  if (!/^[0-9a-f]+$/i.test(normalized) || normalized.length % 2 !== 0) throw new Error(`${label} must be valid hex`);
  return Uint8Array.from(Buffer.from(normalized, "hex"));
}

export function base64ToBytes(value: string, label = "value"): Uint8Array {
  try {
    const bytes = Uint8Array.from(Buffer.from(value, "base64"));
    if (!value || bytes.length === 0) throw new Error();
    return bytes;
  } catch {
    throw new Error(`${label} must be valid base64`);
  }
}

export function signatureToBytes(value: Uint8Array | string): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (/^(?:0x)?[0-9a-f]+$/i.test(value) && value.replace(/^0x/i, "").length % 2 === 0) return hexToBytes(value, "witnessSignature");
  return base64ToBytes(value, "witnessSignature");
}

function arrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

async function sha256Bytes(value: Uint8Array): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto SHA-256 is unavailable");
  const digest = await subtle.digest("SHA-256", value as BufferSource);
  return new Uint8Array(digest);
}

export async function sha256Hex(value: string | Uint8Array): Promise<string> {
  return bytesToHex(await sha256Bytes(typeof value === "string" ? utf8(value) : value));
}

export interface EvidenceCanonicalInput {
  readonly kind: string;
  readonly label: string;
  readonly description?: string | null;
  readonly collectedAt: string;
  readonly contentHash: string;
  readonly storageReference?: string | null;
  readonly metadata?: unknown;
}

export interface ObservationCanonicalInput {
  readonly eventId: string;
  readonly witnessId: string;
  readonly kind: string;
  readonly summary: string;
  readonly payload?: unknown;
  readonly contentHash?: string | null;
  readonly observedAt: string;
}

export function canonicalEvidence(input: EvidenceCanonicalInput): string {
  return canonicalize({
    canonicalizationVersion: EVIDENCE_CANONICALIZATION_VERSION,
    kind: input.kind,
    label: input.label,
    description: input.description ?? null,
    collectedAt: input.collectedAt,
    contentHash: input.contentHash,
    storageReference: input.storageReference ?? null,
    metadata: input.metadata ?? null,
  });
}

export function canonicalObservation(input: ObservationCanonicalInput): string {
  return canonicalize({
    canonicalizationVersion: OBSERVATION_CANONICALIZATION_VERSION,
    eventId: input.eventId,
    witnessId: input.witnessId,
    kind: input.kind,
    summary: input.summary,
    payload: input.payload ?? null,
    contentHash: input.contentHash ?? null,
    observedAt: input.observedAt,
  });
}

export async function evidenceCommitment(input: EvidenceCanonicalInput): Promise<{ canonical: string; commitment: string }> {
  const canonical = canonicalEvidence(input);
  return { canonical, commitment: await sha256Hex(canonical) };
}

export async function observationCommitment(input: ObservationCanonicalInput): Promise<{ canonical: string; commitment: string }> {
  const canonical = canonicalObservation(input);
  return { canonical, commitment: await sha256Hex(canonical) };
}

function normalizedCommitments(commitments: readonly string[], label: string): string[] {
  if (commitments.length === 0) throw new Error(`At least one ${label} commitment is required`);
  return commitments.map((value, index) => {
    const normalized = value.replace(/^sha256:/i, "").toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(normalized)) throw new Error(`${label} commitment ${index} must be a 32-byte SHA-256 hex digest`);
    return normalized;
  }).sort();
}

export async function evidenceSetCommitment(commitments: readonly string[]): Promise<string> {
  return sha256Hex(canonicalize({ canonicalizationVersion: EVIDENCE_CANONICALIZATION_VERSION, commitments: normalizedCommitments(commitments, "evidence") }));
}

export async function observationSetCommitment(commitments: readonly string[]): Promise<string> {
  return sha256Hex(canonicalize({ canonicalizationVersion: OBSERVATION_CANONICALIZATION_VERSION, commitments: normalizedCommitments(commitments, "observation") }));
}

export interface WitnessSignatureMessageInput {
  readonly eventNumber: bigint | number | string;
  readonly witnessOwner: string;
  readonly witnessId: Uint8Array | string;
  readonly observationCommitment: string;
  readonly evidenceCommitment: string;
}

export function witnessSignatureMessage(input: WitnessSignatureMessageInput): Uint8Array {
  return utf8(canonicalize({
    version: WITNESS_SIGNATURE_VERSION,
    eventNumber: String(input.eventNumber),
    witnessOwner: new PublicKey(input.witnessOwner).toBase58(),
    witnessId: typeof input.witnessId === "string" ? input.witnessId.replace(/^0x/i, "").toLowerCase() : bytesToHex(input.witnessId),
    observationCommitment: input.observationCommitment.replace(/^sha256:/i, "").toLowerCase(),
    evidenceCommitment: input.evidenceCommitment.replace(/^sha256:/i, "").toLowerCase(),
  }));
}

export async function witnessSignatureCommitment(signature: Uint8Array | string): Promise<string> {
  return sha256Hex(signatureToBytes(signature));
}

export async function verifyWitnessSignature(input: {
  readonly witnessOwner: string;
  readonly message: Uint8Array;
  readonly signature: Uint8Array | string;
}): Promise<boolean> {
  const signature = signatureToBytes(input.signature);
  if (signature.length !== 64) return false;
  try {
    const key = await globalThis.crypto.subtle.importKey("raw", arrayBuffer(new PublicKey(input.witnessOwner).toBytes()), { name: "Ed25519" } as AlgorithmIdentifier, false, ["verify"]);
    return await globalThis.crypto.subtle.verify({ name: "Ed25519" } as AlgorithmIdentifier, key, arrayBuffer(signature), arrayBuffer(input.message));
  } catch {
    return false;
  }
}
