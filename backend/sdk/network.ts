import { PublicKey } from "@solana/web3.js";

export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet" | "localnet";

export interface SolanaNetworkConfig {
  readonly network: SolanaNetwork;
  readonly rpcUrl: string;
  readonly programId: PublicKey;
  readonly programIdString: string;
  readonly explorerBaseUrl: string;
}

export const DEFAULT_PROGRAM_ID = "Cp1QZyTidu8ZFj5tcYNEw2Z7fJTBmAR6gA8vnzQHNKbT";

const DEFAULT_RPC_URLS: Record<SolanaNetwork, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  localnet: "http://127.0.0.1:8899",
};

export function normalizeSolanaNetwork(value: string | undefined): SolanaNetwork {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "mainnet" || normalized === "mainnet-beta") return "mainnet-beta";
  if (normalized === "testnet" || normalized === "devnet" || normalized === "localnet") return normalized;
  return "devnet";
}

export function getSolanaNetworkConfig(input: {
  network?: string;
  rpcUrl?: string;
  programId?: string | PublicKey;
  explorerBaseUrl?: string;
} = {}): SolanaNetworkConfig {
  const network = normalizeSolanaNetwork(input.network);
  const programId = input.programId instanceof PublicKey
    ? input.programId
    : new PublicKey(input.programId?.trim() || DEFAULT_PROGRAM_ID);
  const rpcUrl = input.rpcUrl?.trim() || DEFAULT_RPC_URLS[network];
  const explorerBaseUrl = (input.explorerBaseUrl?.trim() || "https://explorer.solana.com").replace(/\/+$/, "");
  return { network, rpcUrl, programId, programIdString: programId.toBase58(), explorerBaseUrl };
}

export function getSolanaConfigFromEnv(env: Record<string, string | undefined> = process.env): SolanaNetworkConfig {
  return getSolanaNetworkConfig({
    network: env.NEXT_PUBLIC_SOLANA_NETWORK || env.SOLANA_NETWORK,
    rpcUrl: env.NEXT_PUBLIC_SOLANA_RPC_URL || env.SOLANA_RPC_URL,
    programId: env.NEXT_PUBLIC_SOLANA_PROGRAM_ID || env.SOLANA_PROGRAM_ID,
    explorerBaseUrl: env.NEXT_PUBLIC_SOLANA_EXPLORER_URL || env.SOLANA_EXPLORER_URL,
  });
}
