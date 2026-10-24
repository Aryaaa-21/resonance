import { explorerAccountUrl, explorerTransactionUrl } from "@/sdk/explorer";
import { getSolanaNetworkConfig } from "@/sdk/network";
import type { ProtocolMetadata } from "@/types/protocol";

export function protocolNetworkConfig(metadata: Pick<ProtocolMetadata, "network" | "programId"> & { rpcUrl?: string }) {
  return getSolanaNetworkConfig({ network: metadata.network.replace(/^solana-/, ""), rpcUrl: metadata.rpcUrl, programId: metadata.programId });
}

export function protocolTransactionUrl(metadata: Pick<ProtocolMetadata, "network" | "programId" | "transactionSignature"> & { rpcUrl?: string }): string | null {
  if (!metadata.transactionSignature) return null;
  return explorerTransactionUrl(metadata.transactionSignature, protocolNetworkConfig(metadata));
}

export function protocolAccountUrl(metadata: Pick<ProtocolMetadata, "network" | "programId"> & { rpcUrl?: string }): string {
  return explorerAccountUrl(metadata.programId, protocolNetworkConfig(metadata));
}
