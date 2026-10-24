import { PublicKey } from "@solana/web3.js";
import { bytes32, publicKey, u64ToLe } from "./encoding";

export const PROTOCOL_SEED = Buffer.from("config");
export const EVENT_SEED = Buffer.from("event");
export const WITNESS_SEED = Buffer.from("witness");
export const ATTESTATION_SEED = Buffer.from("attestation");
export const CHALLENGE_SEED = Buffer.from("challenge");

export interface DerivedPda {
  readonly address: PublicKey;
  readonly bump: number;
}

function derive(seeds: readonly Uint8Array[], programId: PublicKey | string): DerivedPda {
  const [address, bump] = PublicKey.findProgramAddressSync([...seeds], publicKey(programId));
  return { address, bump };
}

export function deriveProtocolPda(programId: PublicKey | string): DerivedPda {
  return derive([PROTOCOL_SEED], programId);
}

export const deriveConfigPda = deriveProtocolPda;

export function deriveEventPda(programId: PublicKey | string, eventId: bigint | number | string): DerivedPda {
  return derive([EVENT_SEED, u64ToLe(eventId)], programId);
}

export function deriveWitnessPda(programId: PublicKey | string, owner: PublicKey | string, witnessId: Uint8Array | string): DerivedPda {
  return derive([WITNESS_SEED, publicKey(owner).toBytes(), bytes32(witnessId, "witnessId")], programId);
}

export function deriveAttestationPda(programId: PublicKey | string, eventPda: PublicKey | string, witnessPda: PublicKey | string): DerivedPda {
  return derive([ATTESTATION_SEED, publicKey(eventPda).toBytes(), publicKey(witnessPda).toBytes()], programId);
}

export function deriveChallengePda(programId: PublicKey | string, eventPda: PublicKey | string, challengeId: Uint8Array | string): DerivedPda {
  return derive([CHALLENGE_SEED, publicKey(eventPda).toBytes(), bytes32(challengeId, "challengeId")], programId);
}
