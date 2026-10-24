import type { NetworkHealth, SimulationMetadata, SupportedNetwork } from "./status";

export interface NetworkStats {
  readonly network: SupportedNetwork;
  readonly health: NetworkHealth;
  readonly sampledAt: string;
  readonly activeWitnesses: number;
  readonly eventsObserved24h: number;
  readonly verificationsCompleted24h: number;
  readonly openChallenges: number;
  readonly averageConfidence: number;
  readonly simulatedAttestations24h: number;
  readonly simulation?: SimulationMetadata;
}
