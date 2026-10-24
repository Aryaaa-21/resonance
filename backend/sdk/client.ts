import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { getSolanaNetworkConfig, type SolanaNetworkConfig } from "./network";
import { buildSubmitAttestationInstruction, type SubmitAttestationArgs } from "./instructions";
import { submitAndTrackTransaction, type TransactionLifecycleState, type WalletTransactionSigner } from "./lifecycle";

export class ProtocolClient {
  readonly connection: Connection;
  readonly config: SolanaNetworkConfig;

  constructor(input: { connection?: Connection; config?: SolanaNetworkConfig } = {}) {
    this.config = input.config ?? getSolanaNetworkConfig();
    this.connection = input.connection ?? new Connection(this.config.rpcUrl, "confirmed");
  }

  buildSubmitAttestation(args: Omit<SubmitAttestationArgs, "programId"> & { programId?: PublicKey | string }) {
    return buildSubmitAttestationInstruction({ ...args, programId: args.programId ?? this.config.programId });
  }

  async submitAttestation(args: Omit<SubmitAttestationArgs, "programId" | "submitter"> & { signer: WalletTransactionSigner; programId?: PublicKey | string; onState?: (state: TransactionLifecycleState) => void }): Promise<TransactionLifecycleState> {
    const built = this.buildSubmitAttestation({ ...args, submitter: args.signer.publicKey });
    const transaction = new Transaction().add(built.instruction);
    return submitAndTrackTransaction({ connection: this.connection, transaction, signer: args.signer, commitment: "finalized", onState: args.onState });
  }
}
