import type { Commitment, Connection, Transaction, TransactionSignature } from "@solana/web3.js";

export const TRANSACTION_LIFECYCLE_STATUSES = ["built", "signed", "submitted", "confirmed", "finalized", "failed"] as const;
export type TransactionLifecycleStatus = (typeof TRANSACTION_LIFECYCLE_STATUSES)[number];

export interface TransactionLifecycleState {
  readonly status: TransactionLifecycleStatus;
  readonly signature?: TransactionSignature;
  readonly slot?: number;
  readonly confirmationStatus?: "processed" | "confirmed" | "finalized" | null;
  readonly error?: string;
}

export interface WalletTransactionSigner {
  readonly publicKey: import("@solana/web3.js").PublicKey;
  signTransaction(transaction: Transaction): Promise<Transaction>;
}

export function lifecycleFromConfirmation(
  confirmationStatus: "processed" | "confirmed" | "finalized" | null | undefined,
  error?: unknown,
): TransactionLifecycleStatus {
  if (error) return "failed";
  if (confirmationStatus === "finalized") return "finalized";
  if (confirmationStatus === "confirmed") return "confirmed";
  if (confirmationStatus === "processed") return "submitted";
  return "submitted";
}

export function lifecycleFromRpcStatus(status: {
  confirmationStatus?: "processed" | "confirmed" | "finalized" | null;
  err?: unknown;
} | null | undefined): TransactionLifecycleStatus {
  if (!status) return "submitted";
  return lifecycleFromConfirmation(status.confirmationStatus, status.err);
}

export function lifecycleState(status: TransactionLifecycleStatus, input: Omit<TransactionLifecycleState, "status"> = {}): TransactionLifecycleState {
  return { status, ...input };
}

function transactionFinality(commitment: Commitment): "confirmed" | "finalized" {
  return commitment === "finalized" ? "finalized" : "confirmed";
}

export async function submitAndTrackTransaction(input: {
  connection: Connection;
  transaction: Transaction;
  signer: WalletTransactionSigner;
  commitment?: Commitment;
  onState?: (state: TransactionLifecycleState) => void;
}): Promise<TransactionLifecycleState> {
  const notify = (state: TransactionLifecycleState) => input.onState?.(state);
  notify(lifecycleState("built"));
  const transaction = input.transaction;
  let latest: { blockhash: string; lastValidBlockHeight: number };
  try {
    transaction.feePayer = input.signer.publicKey;
    latest = await input.connection.getLatestBlockhash(input.commitment ?? "confirmed");
    transaction.recentBlockhash = latest.blockhash;
  } catch (error) {
    const state = lifecycleState("failed", { error: error instanceof Error ? error.message : String(error) });
    notify(state);
    return state;
  }
  let signed: Transaction;
  try {
    signed = await input.signer.signTransaction(transaction);
  } catch (error) {
    const state = lifecycleState("failed", { error: error instanceof Error ? error.message : String(error) });
    notify(state);
    return state;
  }
  notify(lifecycleState("signed"));
  let signature: string;
  try {
    signature = await input.connection.sendRawTransaction(signed.serialize());
  } catch (error) {
    const state = lifecycleState("failed", { error: error instanceof Error ? error.message : String(error) });
    notify(state);
    return state;
  }
  notify(lifecycleState("submitted", { signature }));
  try {
    const confirmation = await input.connection.confirmTransaction({ signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight }, input.commitment ?? "confirmed");
    if (confirmation.value.err) {
      const state = lifecycleState("failed", { signature, error: JSON.stringify(confirmation.value.err) });
      notify(state);
      return state;
    }
    const statusResponse = await input.connection.getSignatureStatuses([signature]);
    const status = statusResponse.value[0];
    const mapped = lifecycleFromRpcStatus(status);
    const transactionInfo = await input.connection.getTransaction(signature, { commitment: transactionFinality(input.commitment ?? "confirmed"), maxSupportedTransactionVersion: 0 });
    const expectedConfirmation = input.commitment === "finalized" ? "finalized" : "confirmed";
    const state = lifecycleState(mapped === "submitted" ? expectedConfirmation : mapped, {
      signature,
      slot: transactionInfo?.slot ?? status?.slot ?? undefined,
      confirmationStatus: status?.confirmationStatus ?? "confirmed",
    });
    notify(state);
    if ((input.commitment ?? "confirmed") !== "finalized" && state.status !== "failed") return state;
    return state;
  } catch (error) {
    const state = lifecycleState("failed", { signature, error: error instanceof Error ? error.message : String(error) });
    notify(state);
    return state;
  }
}
