import type { PublicKey } from "@solana/web3.js";
import type { SolanaNetworkConfig } from "./network";

function clusterQuery(config: SolanaNetworkConfig): string {
  if (config.network === "mainnet-beta") return "";
  if (config.network === "localnet") return `?cluster=custom&customUrl=${encodeURIComponent(config.rpcUrl)}`;
  return `?cluster=${config.network}`;
}

function value(value: PublicKey | string): string {
  return typeof value === "string" ? value : value.toBase58();
}

export function explorerTransactionUrl(signature: string, config: SolanaNetworkConfig): string {
  return `${config.explorerBaseUrl}/tx/${encodeURIComponent(signature)}${clusterQuery(config)}`;
}

export function explorerAccountUrl(address: PublicKey | string, config: SolanaNetworkConfig): string {
  return `${config.explorerBaseUrl}/address/${encodeURIComponent(value(address))}${clusterQuery(config)}`;
}

export const explorerAddressUrl = explorerAccountUrl;

export function explorerProgramUrl(programId: PublicKey | string, config: SolanaNetworkConfig): string {
  return explorerAccountUrl(programId, config);
}
