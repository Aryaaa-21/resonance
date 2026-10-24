export const SIMULATION_NOTICE = "DEMO DATA · TESTNET SIMULATION · NO MAINNET CLAIMS" as const;

export type SimulationNotice = typeof SIMULATION_NOTICE;
export type SimulationMode = "demo" | "testnet-simulation";
export type DataEnvironment = "demo" | "testnet";
export type DataSource = "mock";
export type SupportedNetwork = "solana-devnet" | "solana-testnet" | "solana-mainnet-beta" | "solana-localnet";

/** Shared lifecycle vocabulary used by records that move through the protocol. */
export type LifecycleStatus =
  | "draft"
  | "pending"
  | "active"
  | "processing"
  | "completed"
  | "failed"
  | "archived";

/** Shared verification vocabulary for claims and observations. */
export type VerificationState =
  | "unverified"
  | "review"
  | "verified"
  | "challenged"
  | "rejected";

export type WitnessStatus = "active" | "review" | "offline" | "suspended";
export type EvidenceStatus = "received" | "analyzing" | "verified" | "rejected" | "expired";
export type ChallengeStatus = "pending" | "open" | "under_review" | "accepted" | "rejected" | "inconclusive" | "resolved" | "dismissed" | "expired";
export type AttestationStatus = "queued" | "built" | "signed" | "submitted" | "confirmed" | "finalized" | "simulated" | "failed" | "superseded";
export type AttestationPublicationState = "not_submitted" | "submitted" | "confirmed" | "finalized" | "failed" | "simulation_only";
export type AIAlertSeverity = "info" | "low" | "medium" | "high" | "critical";
export type AIAlertStatus = "open" | "acknowledged" | "resolved" | "dismissed";
export type WalletStatus = "disconnected" | "connecting" | "connected" | "wrong_network" | "unsupported";
export type NetworkHealth = "healthy" | "degraded" | "offline";

/** Required on every demo record so UI code cannot mistake mock data for protocol truth. */
export interface SimulationMetadata {
  readonly source: DataSource;
  readonly mode: SimulationMode;
  readonly environment: DataEnvironment;
  readonly network: SupportedNetwork;
  readonly isSimulation: true;
  readonly notice: SimulationNotice;
}
