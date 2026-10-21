import { getRuntimeConfig } from "../config";

export type { ProtocolAdapter } from "../integrations/solana/interface";
export type { ProtocolPublicationRequest, ProtocolPublicationResult, ProtocolPreparationResult, ProtocolSyncRequest, ProtocolSyncResult } from "../integrations/solana/types";
export { DemoProtocolAdapter, demoProtocolAdapter } from "../integrations/solana/demo-adapter";
export { SolanaProtocolAdapter, solanaProtocolAdapter } from "../integrations/solana/solana-adapter";
import { demoProtocolAdapter } from "../integrations/solana/demo-adapter";
import { solanaProtocolAdapter } from "../integrations/solana/solana-adapter";

export function getProtocolAdapter(mode: "demo" | "solana" = getRuntimeConfig().solanaAdapter) {
  return mode === "solana" ? solanaProtocolAdapter : demoProtocolAdapter;
}

/** Explicit compatibility alias; callers should choose the adapter deliberately. */
export const protocolAdapter = demoProtocolAdapter;
