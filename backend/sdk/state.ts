import { PublicKey } from "@solana/web3.js";

export interface ProtocolConfigState {
  readonly authority: PublicKey;
  readonly resolver: PublicKey;
  readonly paused: boolean;
  readonly bump: number;
  readonly minAttestations: number;
  readonly challengePeriodSlots: bigint;
  readonly minChallengeBondLamports: bigint;
  readonly version: number;
}

export interface EventState {
  readonly config: PublicKey;
  readonly creator: PublicKey;
  readonly eventType: "delivery" | "location_arrival";
  readonly eventId: bigint;
  readonly protocolVersion: number;
  readonly eventIdentityCommitment: Uint8Array;
  readonly evidenceCommitment: Uint8Array;
  readonly resultCommitment: Uint8Array;
  readonly createdSlot: bigint;
  readonly deadlineSlot: bigint;
  readonly finalizedSlot: bigint;
  readonly requiredWitnesses: number;
  readonly requiredAttestations: number;
  readonly attestationCount: number;
  readonly yesCount: number;
  readonly noCount: number;
  readonly openChallenges: number;
  readonly status: "open" | "attested" | "finalized" | "challenged" | "failed" | "cancelled";
  readonly finalOutcome: boolean;
  readonly hasFinalOutcome: boolean;
  readonly provisionalConsensus: boolean;
  readonly bump: number;
}

export interface WitnessState {
  readonly config: PublicKey;
  readonly owner: PublicKey;
  readonly witnessId: Uint8Array;
  readonly witnessType: "device" | "human" | "service" | "iot" | "ai_agent";
  readonly metadataCommitment: Uint8Array;
  readonly registeredSlot: bigint;
  readonly attestationCount: number;
  readonly active: boolean;
  readonly bump: number;
}

export interface AttestationState {
  readonly event: PublicKey;
  readonly witness: PublicKey;
  readonly submitter: PublicKey;
  readonly result: "supports" | "refutes" | "inconclusive";
  readonly observationCommitment: Uint8Array;
  readonly evidenceCommitment: Uint8Array;
  readonly witnessSignatureCommitment: Uint8Array;
  readonly observationTimestamp: bigint;
  readonly submittedSlot: bigint;
  readonly bump: number;
}

export interface ChallengeState {
  readonly event: PublicKey;
  readonly challenger: PublicKey;
  readonly challengeId: Uint8Array;
  readonly reasonCommitment: Uint8Array;
  readonly openedSlot: bigint;
  readonly resolvedSlot: bigint;
  readonly bondLamports: bigint;
  readonly status: "open" | "resolved";
  readonly upheld: boolean;
  readonly bump: number;
}

function reader(data: Buffer | Uint8Array) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    pubkey(offset: number) { return new PublicKey(data.slice(offset, offset + 32)); },
    bytes(offset: number, length: number) { return Uint8Array.from(data.slice(offset, offset + length)); },
    u8(offset: number) { return view.getUint8(offset); },
    u16(offset: number) { return view.getUint16(offset, true); },
    u32(offset: number) { return view.getUint32(offset, true); },
    u64(offset: number) { return view.getBigUint64(offset, true); },
    i64(offset: number) { return view.getBigInt64(offset, true); },
  };
}

export function decodeProtocolConfig(data: Buffer | Uint8Array): ProtocolConfigState {
  const read = reader(data);
  return { authority: read.pubkey(8), resolver: read.pubkey(40), paused: read.u8(72) !== 0, bump: read.u8(73), minAttestations: read.u16(74), challengePeriodSlots: read.u64(76), minChallengeBondLamports: read.u64(84), version: read.u8(92) };
}

export function decodeEvent(data: Buffer | Uint8Array): EventState {
  const read = reader(data);
  const eventType = ["delivery", "location_arrival"][read.u8(72)] as EventState["eventType"];
  const status = ["open", "attested", "finalized", "challenged", "failed", "cancelled"][read.u8(214)] as EventState["status"];
  if (!eventType) throw new Error("Unknown event type");
  if (!status) throw new Error("Unknown event status");
  return { config: read.pubkey(8), creator: read.pubkey(40), eventType, eventId: read.u64(73), protocolVersion: read.u8(81), eventIdentityCommitment: read.bytes(82, 32), evidenceCommitment: read.bytes(114, 32), resultCommitment: read.bytes(146, 32), createdSlot: read.u64(178), deadlineSlot: read.u64(186), finalizedSlot: read.u64(194), requiredWitnesses: read.u16(202), requiredAttestations: read.u16(204), attestationCount: read.u16(206), yesCount: read.u16(208), noCount: read.u16(210), openChallenges: read.u16(212), status, finalOutcome: read.u8(215) !== 0, hasFinalOutcome: read.u8(216) !== 0, provisionalConsensus: read.u8(217) !== 0, bump: read.u8(218) };
}

export function decodeWitness(data: Buffer | Uint8Array): WitnessState {
  const read = reader(data);
  const witnessType = ["device", "human", "service", "iot", "ai_agent"][read.u8(104)] as WitnessState["witnessType"];
  if (!witnessType) throw new Error("Unknown witness type");
  return { config: read.pubkey(8), owner: read.pubkey(40), witnessId: read.bytes(72, 32), witnessType, metadataCommitment: read.bytes(105, 32), registeredSlot: read.u64(137), attestationCount: read.u32(145), active: read.u8(149) !== 0, bump: read.u8(150) };
}

export function decodeAttestation(data: Buffer | Uint8Array): AttestationState {
  const read = reader(data);
  const result = ["supports", "refutes", "inconclusive"][read.u8(104)] as AttestationState["result"];
  if (!result) throw new Error("Unknown attestation result");
  return { event: read.pubkey(8), witness: read.pubkey(40), submitter: read.pubkey(72), result, observationCommitment: read.bytes(105, 32), evidenceCommitment: read.bytes(137, 32), witnessSignatureCommitment: read.bytes(169, 32), observationTimestamp: read.i64(201), submittedSlot: read.u64(209), bump: read.u8(217) };
}

export function decodeChallenge(data: Buffer | Uint8Array): ChallengeState {
  const read = reader(data);
  const status = ["open", "resolved"][read.u8(160)] as ChallengeState["status"];
  if (!status) throw new Error("Unknown challenge status");
  return { event: read.pubkey(8), challenger: read.pubkey(40), challengeId: read.bytes(72, 32), reasonCommitment: read.bytes(104, 32), openedSlot: read.u64(136), resolvedSlot: read.u64(144), bondLamports: read.u64(152), status, upheld: read.u8(161) !== 0, bump: read.u8(162) };
}
