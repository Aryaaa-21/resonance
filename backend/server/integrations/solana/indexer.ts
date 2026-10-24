import { Connection, PublicKey } from "@solana/web3.js";
import { decodeAttestation, decodeChallenge, decodeEvent, decodeProtocolConfig, decodeWitness } from "@/sdk/state";
import { getRuntimeConfig } from "@/server/config";

/**
 * Small polling/indexing boundary for Phase 3. It reads protocol-owned PDA
 * accounts and transaction status without pretending to be a durable indexer.
 * A future worker can replace this class while keeping the same adapter seam.
 */
export class SolanaIndexer {
  readonly connection: Connection;
  readonly programId: PublicKey;

  constructor(connection?: Connection) {
    const config = getRuntimeConfig().solana;
    this.connection = connection ?? new Connection(config.rpcUrl, getRuntimeConfig().solanaCommitment);
    this.programId = config.programId;
  }

  async readProtocolAccount(address: PublicKey | string) {
    const account = await this.connection.getAccountInfo(typeof address === "string" ? new PublicKey(address) : address, getRuntimeConfig().solanaCommitment);
    if (!account) return null;
    return { address: typeof address === "string" ? address : address.toBase58(), owner: account.owner.toBase58(), lamports: account.lamports, data: account.data };
  }

  async readDecodedAccount(kind: "config" | "event" | "witness" | "attestation" | "challenge", address: PublicKey | string) {
    const account = await this.readProtocolAccount(address);
    if (!account) return null;
    const decoder = { config: decodeProtocolConfig, event: decodeEvent, witness: decodeWitness, attestation: decodeAttestation, challenge: decodeChallenge }[kind];
    return { ...account, state: decoder(account.data) };
  }

  async getTransactionStatus(signature: string) {
    const result = await this.connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
    return result.value[0] ?? null;
  }
}

export const solanaIndexer = new SolanaIndexer();
