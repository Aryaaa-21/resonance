import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { bytes32, commitmentToBytes, i64ToLe, publicKey, u16ToLe, u64ToLe } from "./encoding";
import { deriveAttestationPda, deriveChallengePda, deriveEventPda, deriveProtocolPda, deriveWitnessPda } from "./pda";

const DISCRIMINATORS = {
  initializeProtocol: "bce9fc6a8692ca5b",
  createEvent: "31db1dcb16626457",
  registerWitness: "0fa9b028ff920b93",
  submitAttestation: "eedcff69b7d32853",
  finalizeEvent: "58f67b696494aaec",
  openChallenge: "38b0030c1ccd0a05",
  resolveChallenge: "51bf7c7783f89d6d",
  updateConfig: "1d9efcbf0a53db63",
  pauseProtocol: "905f006b7727f88d",
  unpauseProtocol: "b79a05b7694c5712",
  cancelEvent: "378f242d3bf15977",
  closeEvent: "7572c13631194bc2",
  closeChallenge: "1d9c6d11296347ec",
} as const;

function discriminator(name: keyof typeof DISCRIMINATORS): Buffer {
  return Buffer.from(DISCRIMINATORS[name], "hex");
}

function instruction(name: keyof typeof DISCRIMINATORS, programId: PublicKey | string, keys: ReadonlyArray<{ pubkey: PublicKey; isSigner: boolean; isWritable: boolean }>, args: readonly Uint8Array[] = []): TransactionInstruction {
  return new TransactionInstruction({ programId: publicKey(programId), keys: [...keys], data: Buffer.concat([discriminator(name), ...args.map((arg) => Buffer.from(arg))]) });
}

const readonly = (pubkey: PublicKey | string) => ({ pubkey: publicKey(pubkey), isSigner: false, isWritable: false });
const writable = (pubkey: PublicKey | string) => ({ pubkey: publicKey(pubkey), isSigner: false, isWritable: true });
const signer = (pubkey: PublicKey | string, isWritable = false) => ({ pubkey: publicKey(pubkey), isSigner: true, isWritable });

export interface InitializeProtocolArgs { readonly programId: PublicKey | string; readonly authority: PublicKey | string; readonly resolver: PublicKey | string; readonly minAttestations: number; readonly challengePeriodSlots: bigint | number | string; readonly minChallengeBondLamports: bigint | number | string; }
export function buildInitializeProtocolInstruction(args: InitializeProtocolArgs): { instruction: TransactionInstruction; protocolPda: PublicKey } {
  const protocolPda = deriveProtocolPda(args.programId).address;
  return { protocolPda, instruction: instruction("initializeProtocol", args.programId, [signer(args.authority, true), writable(protocolPda), readonly(SystemProgram.programId)], [publicKey(args.resolver).toBytes(), u16ToLe(args.minAttestations), u64ToLe(args.challengePeriodSlots), u64ToLe(args.minChallengeBondLamports)]) };
}

export type ProtocolEventType = "delivery" | "location_arrival";
export type ProtocolWitnessType = "device" | "human" | "service" | "iot" | "ai_agent";
export type ProtocolAttestationResult = "supports" | "refutes" | "inconclusive";

function enumByte(value: ProtocolEventType | ProtocolWitnessType | ProtocolAttestationResult): number {
  const values: Record<string, number> = {
    delivery: 0,
    location_arrival: 1,
    device: 0,
    human: 1,
    service: 2,
    iot: 3,
    ai_agent: 4,
    supports: 0,
    refutes: 1,
    inconclusive: 2,
  };
  const byte = values[value];
  if (byte === undefined) throw new Error(`Unsupported protocol enum value: ${value}`);
  return byte;
}

export interface CreateEventArgs { readonly programId: PublicKey | string; readonly creator: PublicKey | string; readonly eventType: ProtocolEventType; readonly eventId: bigint | number | string; readonly eventIdentityCommitment: Uint8Array | string; readonly evidenceCommitment: Uint8Array | string; readonly deadlineSlot: bigint | number | string; readonly requiredWitnesses: number; readonly requiredAttestations: number; }
export function buildCreateEventInstruction(args: CreateEventArgs): { instruction: TransactionInstruction; protocolPda: PublicKey; eventPda: PublicKey } {
  if (!Number.isInteger(args.requiredWitnesses) || args.requiredWitnesses < 1 || args.requiredWitnesses > 128) {
    throw new Error("requiredWitnesses must be between 1 and 128");
  }
  if (!Number.isInteger(args.requiredAttestations) || args.requiredAttestations < 1 || args.requiredAttestations > 128) {
    throw new Error("requiredAttestations must be between 1 and 128");
  }
  if (args.requiredAttestations < args.requiredWitnesses) {
    throw new Error("requiredAttestations cannot be below requiredWitnesses");
  }
  const protocolPda = deriveProtocolPda(args.programId).address;
  const eventPda = deriveEventPda(args.programId, args.eventId).address;
  return { protocolPda, eventPda, instruction: instruction("createEvent", args.programId, [readonly(protocolPda), writable(eventPda), signer(args.creator, true), readonly(SystemProgram.programId)], [Buffer.from([enumByte(args.eventType)]), u64ToLe(args.eventId), commitmentToBytes(args.eventIdentityCommitment), commitmentToBytes(args.evidenceCommitment), u64ToLe(args.deadlineSlot), u16ToLe(args.requiredWitnesses), u16ToLe(args.requiredAttestations)]) };
}

export interface RegisterWitnessArgs { readonly programId: PublicKey | string; readonly owner: PublicKey | string; readonly witnessId: Uint8Array | string; readonly witnessType: ProtocolWitnessType; readonly metadataCommitment: Uint8Array | string; }
export function buildRegisterWitnessInstruction(args: RegisterWitnessArgs): { instruction: TransactionInstruction; protocolPda: PublicKey; witnessPda: PublicKey } {
  const protocolPda = deriveProtocolPda(args.programId).address;
  const witnessPda = deriveWitnessPda(args.programId, args.owner, args.witnessId).address;
  return { protocolPda, witnessPda, instruction: instruction("registerWitness", args.programId, [readonly(protocolPda), writable(witnessPda), signer(args.owner, true), readonly(SystemProgram.programId)], [bytes32(args.witnessId, "witnessId"), Buffer.from([enumByte(args.witnessType)]), commitmentToBytes(args.metadataCommitment)]) };
}

export interface SubmitAttestationArgs { readonly programId: PublicKey | string; readonly submitter: PublicKey | string; readonly eventId: bigint | number | string; readonly witnessOwner: PublicKey | string; readonly witnessId: Uint8Array | string; readonly result?: ProtocolAttestationResult; readonly claim?: boolean; readonly observationCommitment?: Uint8Array | string; readonly evidenceCommitment: Uint8Array | string; readonly witnessSignatureCommitment?: Uint8Array | string; readonly observationTimestamp?: bigint | number | string; }
export function buildSubmitAttestationInstruction(args: SubmitAttestationArgs): { instruction: TransactionInstruction; protocolPda: PublicKey; eventPda: PublicKey; witnessPda: PublicKey; attestationPda: PublicKey } {
  const protocolPda = deriveProtocolPda(args.programId).address;
  const eventPda = deriveEventPda(args.programId, args.eventId).address;
  const witnessPda = deriveWitnessPda(args.programId, args.witnessOwner, args.witnessId).address;
  const attestationPda = deriveAttestationPda(args.programId, eventPda, witnessPda).address;
  const result = args.result ?? (args.claim === false ? "refutes" : "supports");
  const observationCommitment = commitmentToBytes(args.observationCommitment ?? args.evidenceCommitment);
  const evidenceCommitment = commitmentToBytes(args.evidenceCommitment);
  // Phase 3 callers remain source-compatible; Phase 4 callers must provide the
  // separately computed witness signature commitment.
  const witnessSignatureCommitment = commitmentToBytes(args.witnessSignatureCommitment ?? args.evidenceCommitment);
  const observationTimestamp = args.observationTimestamp ?? Math.floor(Date.now() / 1000);
  return { protocolPda, eventPda, witnessPda, attestationPda, instruction: instruction("submitAttestation", args.programId, [readonly(protocolPda), writable(eventPda), writable(witnessPda), writable(attestationPda), signer(args.submitter, true), readonly(SystemProgram.programId)], [Buffer.from([enumByte(result)]), observationCommitment, evidenceCommitment, witnessSignatureCommitment, i64ToLe(observationTimestamp)]) };
}

export interface FinalizeEventArgs { readonly programId: PublicKey | string; readonly resolver: PublicKey | string; readonly eventId: bigint | number | string; readonly resultCommitment: Uint8Array | string; }
export function buildFinalizeEventInstruction(args: FinalizeEventArgs): { instruction: TransactionInstruction; protocolPda: PublicKey; eventPda: PublicKey } {
  const protocolPda = deriveProtocolPda(args.programId).address;
  const eventPda = deriveEventPda(args.programId, args.eventId).address;
  return { protocolPda, eventPda, instruction: instruction("finalizeEvent", args.programId, [readonly(protocolPda), writable(eventPda), signer(args.resolver)], [commitmentToBytes(args.resultCommitment)]) };
}

export interface OpenChallengeArgs { readonly programId: PublicKey | string; readonly challenger: PublicKey | string; readonly eventId: bigint | number | string; readonly challengeId: Uint8Array | string; readonly reasonCommitment: Uint8Array | string; readonly bondLamports: bigint | number | string; }
export function buildOpenChallengeInstruction(args: OpenChallengeArgs): { instruction: TransactionInstruction; protocolPda: PublicKey; eventPda: PublicKey; challengePda: PublicKey } {
  const protocolPda = deriveProtocolPda(args.programId).address;
  const eventPda = deriveEventPda(args.programId, args.eventId).address;
  const challengePda = deriveChallengePda(args.programId, eventPda, args.challengeId).address;
  return { protocolPda, eventPda, challengePda, instruction: instruction("openChallenge", args.programId, [readonly(protocolPda), writable(eventPda), writable(challengePda), signer(args.challenger, true), readonly(SystemProgram.programId)], [bytes32(args.challengeId, "challengeId"), commitmentToBytes(args.reasonCommitment), u64ToLe(args.bondLamports)]) };
}

export interface ResolveChallengeArgs { readonly programId: PublicKey | string; readonly resolver: PublicKey | string; readonly eventId: bigint | number | string; readonly challengeId: Uint8Array | string; readonly upheld: boolean; }
export function buildResolveChallengeInstruction(args: ResolveChallengeArgs): { instruction: TransactionInstruction; protocolPda: PublicKey; eventPda: PublicKey; challengePda: PublicKey } {
  const protocolPda = deriveProtocolPda(args.programId).address;
  const eventPda = deriveEventPda(args.programId, args.eventId).address;
  const challengePda = deriveChallengePda(args.programId, eventPda, args.challengeId).address;
  return { protocolPda, eventPda, challengePda, instruction: instruction("resolveChallenge", args.programId, [readonly(protocolPda), writable(eventPda), writable(challengePda), signer(args.resolver)], [Buffer.from([args.upheld ? 1 : 0])]) };
}

export interface UpdateConfigArgs { readonly programId: PublicKey | string; readonly authority: PublicKey | string; readonly resolver: PublicKey | string; readonly minAttestations: number; readonly challengePeriodSlots: bigint | number | string; readonly minChallengeBondLamports: bigint | number | string; }
export function buildUpdateConfigInstruction(args: UpdateConfigArgs): TransactionInstruction {
  const protocolPda = deriveProtocolPda(args.programId).address;
  return instruction("updateConfig", args.programId, [writable(protocolPda), signer(args.authority)], [publicKey(args.resolver).toBytes(), u16ToLe(args.minAttestations), u64ToLe(args.challengePeriodSlots), u64ToLe(args.minChallengeBondLamports)]);
}

function protocolControlInstruction(name: "pauseProtocol" | "unpauseProtocol", programId: PublicKey | string, authority: PublicKey | string): TransactionInstruction {
  return instruction(name, programId, [writable(deriveProtocolPda(programId).address), signer(authority)]);
}
export function buildPauseProtocolInstruction(programId: PublicKey | string, authority: PublicKey | string) { return protocolControlInstruction("pauseProtocol", programId, authority); }
export function buildUnpauseProtocolInstruction(programId: PublicKey | string, authority: PublicKey | string) { return protocolControlInstruction("unpauseProtocol", programId, authority); }

export function buildCancelEventInstruction(args: { readonly programId: PublicKey | string; readonly authority: PublicKey | string; readonly eventId: bigint | number | string }): { instruction: TransactionInstruction; protocolPda: PublicKey; eventPda: PublicKey } {
  const protocolPda = deriveProtocolPda(args.programId).address;
  const eventPda = deriveEventPda(args.programId, args.eventId).address;
  return { protocolPda, eventPda, instruction: instruction("cancelEvent", args.programId, [readonly(protocolPda), writable(eventPda), signer(args.authority)]) };
}

export function buildCloseEventInstruction(args: { readonly programId: PublicKey | string; readonly resolver: PublicKey | string; readonly recipient: PublicKey | string; readonly eventId: bigint | number | string }): { instruction: TransactionInstruction; protocolPda: PublicKey; eventPda: PublicKey } {
  const protocolPda = deriveProtocolPda(args.programId).address;
  const eventPda = deriveEventPda(args.programId, args.eventId).address;
  return { protocolPda, eventPda, instruction: instruction("closeEvent", args.programId, [readonly(protocolPda), writable(eventPda), signer(args.resolver), signer(args.recipient, true)]) };
}

export function buildCloseChallengeInstruction(args: { readonly programId: PublicKey | string; readonly closer: PublicKey | string; readonly eventId: bigint | number | string; readonly challengeId: Uint8Array | string }): { instruction: TransactionInstruction; protocolPda: PublicKey; eventPda: PublicKey; challengePda: PublicKey } {
  const protocolPda = deriveProtocolPda(args.programId).address;
  const eventPda = deriveEventPda(args.programId, args.eventId).address;
  const challengePda = deriveChallengePda(args.programId, eventPda, args.challengeId).address;
  return { protocolPda, eventPda, challengePda, instruction: instruction("closeChallenge", args.programId, [readonly(eventPda), writable(challengePda), signer(args.closer, true)], [bytes32(args.challengeId, "challengeId")]) };
}
