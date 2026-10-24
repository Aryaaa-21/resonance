import type { TransactionLifecycleStatus } from "@/sdk/lifecycle";

export interface ProtocolPublicationRequest {
  readonly eventId: string;
  readonly eventNumber: bigint | number | string;
  readonly witnessOwner: string;
  readonly witnessId: string;
  readonly claim: boolean;
  readonly result?: "supports" | "refutes" | "inconclusive";
  readonly observationCommitment?: string;
  readonly observationTimestamp?: bigint | number | string;
  readonly evidenceCommitment: string;
  readonly witnessSignatureCommitment?: string;
  readonly network?: string;
  readonly programId?: string;
  readonly walletAddress?: string;
}

export interface ProtocolPreparationResult {
  readonly lifecycle: "built";
  readonly network: string;
  readonly programId: string;
  readonly serializedTransaction: string;
  readonly eventPda: string;
  readonly witnessPda: string;
  readonly attestationPda: string;
  readonly challengePda: null;
  readonly commitment: string;
  /** Expected top-level instruction data, base64 encoded for later RPC verification. */
  readonly expectedInstructionData: string;
  /** Ordered account list expected by the Anchor instruction. */
  readonly expectedInstructionAccounts: readonly string[];
  readonly expectedSubmitter: string;
  readonly explorerUrl: null;
}

export interface ProtocolSyncExpectation {
  readonly programId: string;
  readonly eventPda: string;
  readonly witnessPda: string;
  readonly attestationPda: string;
  readonly instructionData: string;
  readonly instructionAccounts: readonly string[];
  readonly submitter: string;
  readonly observationCommitment?: string;
  readonly evidenceCommitment?: string;
  readonly witnessSignatureCommitment?: string;
}

export interface ProtocolSyncRequest {
  readonly attestationId: string;
  readonly transactionSignature: string;
  readonly expected: ProtocolSyncExpectation;
}

export interface ProtocolSyncResult {
  readonly lifecycle: TransactionLifecycleStatus;
  readonly verified: boolean;
  readonly network: string;
  readonly programId: string;
  readonly transactionSignature: string;
  readonly slot: number | null;
  readonly confirmationStatus: "processed" | "confirmed" | "finalized" | null;
  readonly error: string | null;
  readonly eventPda: string | null;
  readonly witnessPda: string | null;
  readonly attestationPda: string | null;
  readonly challengePda: null;
  readonly explorerUrl: string;
}

export type ProtocolPublicationResult =
  | {
      readonly status: "simulated" | "not_submitted";
      readonly adapterReference: string | null;
      readonly isSimulation: true;
      readonly notice: string;
    }
  | {
      readonly status: "submitted" | "confirmed" | "finalized" | "failed";
      readonly adapterReference: null;
      readonly isSimulation: false;
      readonly notice: string;
      readonly transactionSignature: string | null;
      readonly slot: number | null;
      readonly confirmationStatus: "processed" | "confirmed" | "finalized" | null;
      readonly error: string | null;
    };
