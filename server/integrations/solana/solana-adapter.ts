import bs58 from "bs58";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { buildSubmitAttestationInstruction } from "@/sdk/instructions";
import { decodeAttestation } from "@/sdk/state";
import { commitmentToBytes } from "@/sdk/encoding";
import { explorerTransactionUrl } from "@/sdk/explorer";
import { lifecycleFromRpcStatus, submitAndTrackTransaction, type WalletTransactionSigner } from "@/sdk/lifecycle";
import { getRuntimeConfig } from "@/server/config";
import type { ProtocolAdapter } from "./interface";
import type { ProtocolPreparationResult, ProtocolPublicationRequest, ProtocolPublicationResult, ProtocolSyncExpectation, ProtocolSyncRequest, ProtocolSyncResult } from "./types";

function slotNumber(slot: number | null | undefined): number | null {
  return typeof slot === "number" && Number.isSafeInteger(slot) ? slot : null;
}

function equalStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/**
 * Verify the exact top-level Anchor instruction envelope that was prepared for an attestation.
 * This intentionally does not accept a matching signature/status alone as proof of publication.
 */
export function verifyProtocolTransaction(transaction: any, signature: string, expected: ProtocolSyncExpectation): { ok: true } | { ok: false; error: string } {
  try {
    if (!transaction?.transaction?.signatures?.includes(signature)) {
      return { ok: false, error: "RPC transaction does not contain the submitted signature" };
    }
    if (transaction.meta?.err) {
      return { ok: false, error: `RPC transaction failed: ${JSON.stringify(transaction.meta.err)}` };
    }

    const expectedProgram = new PublicKey(expected.programId);
    const message = transaction.transaction.message;
    const accountKeys = message?.getAccountKeys?.();
    const instructions = message?.compiledInstructions;
    if (!accountKeys || !Array.isArray(instructions)) {
      return { ok: false, error: "RPC transaction did not include a compiled message" };
    }

    const programInstructions = instructions.filter((instruction: any) => accountKeys.get(instruction.programIdIndex)?.equals(expectedProgram));
    if (programInstructions.length !== 1) {
      return { ok: false, error: `Expected exactly one instruction for program ${expected.programId}` };
    }

    const instruction = programInstructions[0];
    const actualAccounts = instruction.accountKeyIndexes.map((index: number) => accountKeys.get(index)?.toBase58() ?? "");
    if (!equalStrings(actualAccounts, expected.instructionAccounts)) {
      return { ok: false, error: "RPC instruction accounts do not match the prepared PDA/account envelope" };
    }

    const actualData = Buffer.from(instruction.data).toString("base64");
    if (actualData !== expected.instructionData) {
      return { ok: false, error: "RPC instruction arguments do not match the prepared attestation" };
    }

    const submitterIndex = expected.instructionAccounts.indexOf(expected.submitter);
    if (submitterIndex < 0) {
      return { ok: false, error: "Prepared submitter is missing from the expected instruction accounts" };
    }
    const submitterAccountIndex = instruction.accountKeyIndexes[submitterIndex];
    if (!message.isAccountSigner?.(submitterAccountIndex)) {
      return { ok: false, error: "Prepared submitter was not a signer in the confirmed transaction" };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? `Transaction verification failed: ${error.message}` : "Transaction verification failed" };
  }
}


export function verifyAttestationAccount(account: { owner: PublicKey; data: Buffer | Uint8Array } | null, expected: Pick<ProtocolSyncExpectation, "programId" | "eventPda" | "witnessPda" | "submitter" | "observationCommitment" | "evidenceCommitment" | "witnessSignatureCommitment">): { ok: true } | { ok: false; error: string } {
  try {
    if (!account) return { ok: false, error: "RPC attestation account was not found" };
    if (!account.owner.equals(new PublicKey(expected.programId))) return { ok: false, error: "RPC attestation account is not owned by the configured program" };
    const state = decodeAttestation(account.data);
    if (state.event.toBase58() !== expected.eventPda) return { ok: false, error: "RPC attestation account event does not match the prepared event PDA" };
    if (state.witness.toBase58() !== expected.witnessPda) return { ok: false, error: "RPC attestation account witness does not match the prepared witness PDA" };
    if (state.submitter.toBase58() !== expected.submitter) return { ok: false, error: "RPC attestation account submitter does not match the prepared signer" };
    const hex = (value: Uint8Array) => Buffer.from(value).toString("hex");
    if (expected.observationCommitment && hex(state.observationCommitment) !== expected.observationCommitment.replace(/^sha256:/i, "").toLowerCase()) return { ok: false, error: "RPC attestation observation commitment does not match" };
    if (expected.evidenceCommitment && hex(state.evidenceCommitment) !== expected.evidenceCommitment.replace(/^sha256:/i, "").toLowerCase()) return { ok: false, error: "RPC attestation evidence commitment does not match" };
    if (expected.witnessSignatureCommitment && hex(state.witnessSignatureCommitment) !== expected.witnessSignatureCommitment.replace(/^sha256:/i, "").toLowerCase()) return { ok: false, error: "RPC attestation witness signature commitment does not match" };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? `Attestation account verification failed: ${error.message}` : "Attestation account verification failed" };
  }
}

function signatureIsValid(signature: string): boolean {
  try {
    return bs58.decode(signature).length === 64;
  } catch {
    return false;
  }
}

export class SolanaProtocolAdapter implements ProtocolAdapter {
  readonly name = "solana-anchor-adapter";
  readonly kind = "solana" as const;
  readonly connection: Connection;
  readonly config = getRuntimeConfig().solana;

  constructor(connection?: Connection) {
    this.connection = connection ?? new Connection(this.config.rpcUrl, getRuntimeConfig().solanaCommitment);
  }

  private build(input: ProtocolPublicationRequest) {
    const submitter = new PublicKey(input.walletAddress ?? input.witnessOwner);
    const witnessOwner = new PublicKey(input.witnessOwner);
    if (!submitter.equals(witnessOwner)) {
      throw new Error("The wallet signer must equal the registered witness owner");
    }
    const programId = new PublicKey(input.programId ?? this.config.programId);
    const built = buildSubmitAttestationInstruction({
      programId,
      submitter,
      eventId: input.eventNumber,
      witnessOwner,
      witnessId: input.witnessId,
      claim: input.claim,
      result: input.result,
      observationCommitment: input.observationCommitment,
      evidenceCommitment: input.evidenceCommitment,
      witnessSignatureCommitment: input.witnessSignatureCommitment,
      observationTimestamp: input.observationTimestamp,
    });
    return {
      ...built,
      submitter,
      programId,
      commitment: commitmentToBytes(input.evidenceCommitment),
      expectedInstructionData: built.instruction.data.toString("base64"),
      expectedInstructionAccounts: built.instruction.keys.map((key) => key.pubkey.toBase58()),
    };
  }

  async prepareAttestation(input: ProtocolPublicationRequest): Promise<ProtocolPreparationResult> {
    const built = this.build(input);
    const latest = await this.connection.getLatestBlockhash(getRuntimeConfig().solanaCommitment);
    const transaction = new Transaction({ feePayer: built.submitter, recentBlockhash: latest.blockhash }).add(built.instruction);
    return {
      lifecycle: "built",
      network: `solana-${this.config.network}`,
      programId: built.programId.toBase58(),
      serializedTransaction: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64"),
      eventPda: built.eventPda.toBase58(),
      witnessPda: built.witnessPda.toBase58(),
      attestationPda: built.attestationPda.toBase58(),
      challengePda: null,
      commitment: built.commitment.toString("hex"),
      expectedInstructionData: built.expectedInstructionData,
      expectedInstructionAccounts: built.expectedInstructionAccounts,
      expectedSubmitter: built.submitter.toBase58(),
      explorerUrl: null,
    };
  }

  async publishAttestation(input: ProtocolPublicationRequest, signer?: WalletTransactionSigner): Promise<ProtocolPublicationResult> {
    if (!signer) {
      throw new Error("A caller-provided wallet signer is required for Solana publication");
    }
    const built = this.build({ ...input, walletAddress: signer.publicKey.toBase58() });
    const lifecycle = await submitAndTrackTransaction({
      connection: this.connection,
      transaction: new Transaction().add(built.instruction),
      signer,
      commitment: getRuntimeConfig().solanaCommitment,
    });
    return {
      status: lifecycle.status === "built" || lifecycle.status === "signed" ? "submitted" : lifecycle.status,
      adapterReference: null,
      isSimulation: false,
      notice: lifecycle.status === "failed" ? "The wallet-signed transaction failed or could not be confirmed." : "Wallet-signed transaction submitted to the configured Solana RPC endpoint.",
      transactionSignature: lifecycle.signature ?? null,
      slot: lifecycle.slot ?? null,
      confirmationStatus: lifecycle.confirmationStatus ?? null,
      error: lifecycle.error ?? null,
    };
  }

  async syncAttestation(input: ProtocolSyncRequest): Promise<ProtocolSyncResult> {
    if (!signatureIsValid(input.transactionSignature)) {
      return {
        lifecycle: "failed",
        verified: false,
        network: `solana-${this.config.network}`,
        programId: input.expected.programId,
        transactionSignature: input.transactionSignature,
        slot: null,
        confirmationStatus: null,
        error: "Transaction signature is not a valid Solana base58 signature",
        eventPda: input.expected.eventPda,
        witnessPda: input.expected.witnessPda,
        attestationPda: input.expected.attestationPda,
        challengePda: null,
        explorerUrl: explorerTransactionUrl(input.transactionSignature, this.config),
      };
    }

    const statusResponse = await this.connection.getSignatureStatuses([input.transactionSignature], { searchTransactionHistory: true });
    const status = statusResponse.value[0];
    const mappedLifecycle = lifecycleFromRpcStatus(status);
    const error = status?.err ? JSON.stringify(status.err) : null;
    if (!status || mappedLifecycle === "failed") {
      return {
        lifecycle: mappedLifecycle,
        verified: false,
        network: `solana-${this.config.network}`,
        programId: input.expected.programId,
        transactionSignature: input.transactionSignature,
        slot: slotNumber(status?.slot),
        confirmationStatus: status?.confirmationStatus ?? null,
        error,
        eventPda: input.expected.eventPda,
        witnessPda: input.expected.witnessPda,
        attestationPda: input.expected.attestationPda,
        challengePda: null,
        explorerUrl: explorerTransactionUrl(input.transactionSignature, this.config),
      };
    }

    const transaction = await this.connection.getTransaction(input.transactionSignature, {
      commitment: getRuntimeConfig().solanaCommitment === "finalized" ? "finalized" : "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!transaction) {
      return {
        lifecycle: "submitted",
        verified: false,
        network: `solana-${this.config.network}`,
        programId: input.expected.programId,
        transactionSignature: input.transactionSignature,
        slot: slotNumber(status.slot),
        confirmationStatus: status.confirmationStatus ?? null,
        error: null,
        eventPda: input.expected.eventPda,
        witnessPda: input.expected.witnessPda,
        attestationPda: input.expected.attestationPda,
        challengePda: null,
        explorerUrl: explorerTransactionUrl(input.transactionSignature, this.config),
      };
    }

    const envelopeVerification = verifyProtocolTransaction(transaction, input.transactionSignature, input.expected);
    const accountVerification = envelopeVerification.ok
      ? verifyAttestationAccount(await this.connection.getAccountInfo(new PublicKey(input.expected.attestationPda), getRuntimeConfig().solanaCommitment), input.expected)
      : { ok: false as const, error: "Transaction envelope verification failed" };
    const verification = envelopeVerification.ok && accountVerification.ok
      ? { ok: true as const }
      : { ok: false as const, error: !envelopeVerification.ok ? envelopeVerification.error : accountVerification.ok ? "Attestation account verification failed" : accountVerification.error };
    return {
      lifecycle: verification.ok ? mappedLifecycle : "failed",
      verified: verification.ok,
      network: `solana-${this.config.network}`,
      programId: input.expected.programId,
      transactionSignature: input.transactionSignature,
      slot: slotNumber(transaction.slot ?? status.slot),
      confirmationStatus: status.confirmationStatus ?? null,
      error: verification.ok ? null : verification.error,
      eventPda: input.expected.eventPda,
      witnessPda: input.expected.witnessPda,
      attestationPda: input.expected.attestationPda,
      challengePda: null,
      explorerUrl: explorerTransactionUrl(input.transactionSignature, this.config),
    };
  }
}

export const solanaProtocolAdapter = new SolanaProtocolAdapter();
