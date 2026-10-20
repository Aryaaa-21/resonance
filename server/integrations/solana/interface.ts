import type { WalletTransactionSigner } from "@/sdk/lifecycle";
import type { ProtocolPreparationResult, ProtocolPublicationRequest, ProtocolPublicationResult, ProtocolSyncRequest, ProtocolSyncResult } from "./types";

export interface ProtocolAdapter {
  readonly name: string;
  readonly kind: "demo" | "solana";
  prepareAttestation(input: ProtocolPublicationRequest): Promise<ProtocolPreparationResult>;
  publishAttestation(input: ProtocolPublicationRequest, signer?: WalletTransactionSigner): Promise<ProtocolPublicationResult>;
  syncAttestation(input: ProtocolSyncRequest): Promise<ProtocolSyncResult>;
}
