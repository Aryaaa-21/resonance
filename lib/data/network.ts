import type { NetworkStats } from "../../types";
import { mockNetworkStats } from "../mock";
import { simulateResponse } from "./shared";

/** Returns demo/testnet-shaped network metrics; values are not live chain telemetry. */
export async function getNetworkStats(): Promise<NetworkStats> {
  return simulateResponse(mockNetworkStats);
}
