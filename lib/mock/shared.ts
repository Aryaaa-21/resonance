import { SIMULATION_NOTICE, type SimulationMetadata } from "../../types";

/** Shared marker carried by every record returned from the Phase 1 mock boundary. */
export const DEMO_SIMULATION = {
  source: "mock",
  mode: "demo",
  environment: "demo",
  network: "solana-devnet",
  isSimulation: true,
  notice: SIMULATION_NOTICE,
} as const satisfies SimulationMetadata;

/** Testnet-shaped records remain local simulations and are never chain-confirmed. */
export const TESTNET_SIMULATION = {
  source: "mock",
  mode: "testnet-simulation",
  environment: "testnet",
  network: "solana-devnet",
  isSimulation: true,
  notice: SIMULATION_NOTICE,
} as const satisfies SimulationMetadata;
