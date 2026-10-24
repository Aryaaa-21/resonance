import type { TokenAmount } from "./shared";
import type { SimulationMetadata, SupportedNetwork, WalletStatus } from "./status";

export interface WalletState {
  readonly status: WalletStatus;
  readonly address: string | null;
  readonly network: SupportedNetwork | null;
  readonly balance: TokenAmount | null;
  readonly lastConnectedAt: string | null;
  readonly simulation: SimulationMetadata;
}
