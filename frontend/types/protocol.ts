import type { SupportedNetwork } from "./status";

export type ProtocolTransactionLifecycle = "built" | "signed" | "submitted" | "confirmed" | "finalized" | "failed";

export interface ProtocolMetadata {
  readonly network: SupportedNetwork | string;
  readonly programId: string;
  readonly transactionSignature: string | null;
  readonly slot: number | null;
  readonly confirmationStatus: "processed" | "confirmed" | "finalized" | null;
  readonly eventPda: string | null;
  readonly witnessPda: string | null;
  readonly attestationPda: string | null;
  readonly challengePda: string | null;
  readonly lifecycle?: ProtocolTransactionLifecycle;
  readonly explorerUrl?: string | null;
}

export interface PreparedProtocolTransaction extends ProtocolMetadata {
  readonly lifecycle: "built";
  readonly serializedTransaction: string;
}
