import { strict as assert } from "node:assert";
import test from "node:test";
import { PublicKey } from "@solana/web3.js";
import { commitmentToBytes, nonZeroBytes32 } from "./encoding";
import { explorerAccountUrl, explorerTransactionUrl } from "./explorer";
import { lifecycleFromConfirmation, lifecycleFromRpcStatus } from "./lifecycle";
import { getSolanaNetworkConfig } from "./network";
import { deriveAttestationPda, deriveChallengePda, deriveEventPda, deriveProtocolPda, deriveWitnessPda } from "./pda";
import { buildCreateEventInstruction, buildRegisterWitnessInstruction, buildSubmitAttestationInstruction } from "./instructions";

const programId = new PublicKey("Cp1QZyTidu8ZFj5tcYNEw2Z7fJTBmAR6gA8vnzQHNKbT");
const owner = new PublicKey("11111111111111111111111111111111");

 test("PDA derivation is deterministic and uses Anchor seed order", () => {
  const protocol = deriveProtocolPda(programId);
  assert.equal(protocol.address.toBase58(), deriveProtocolPda(programId).address.toBase58());
  const event = deriveEventPda(programId, 7);
  const witness = deriveWitnessPda(programId, owner, new Uint8Array(32).fill(1));
  const attestation = deriveAttestationPda(programId, event.address, witness.address);
  const challenge = deriveChallengePda(programId, event.address, new Uint8Array(32).fill(2));
  for (const pda of [protocol, event, witness, attestation, challenge]) assert.ok(pda.bump >= 0 && pda.bump <= 255);
  assert.notEqual(event.address.toBase58(), deriveEventPda(programId, 8).address.toBase58());
});

test("commitment encoding accepts non-zero 32-byte values and rejects invalid values", () => {
  assert.equal(commitmentToBytes("11".repeat(32)).length, 32);
  assert.throws(() => commitmentToBytes("00".repeat(32)), /must not be all zero/);
  assert.throws(() => commitmentToBytes("aa"), /exactly 32 bytes/);
  assert.throws(() => nonZeroBytes32(new Uint8Array(31), "witnessId"), /exactly 32 bytes/);
});

test("network config normalizes aliases and preserves explicit endpoints", () => {
  const config = getSolanaNetworkConfig({ network: "mainnet", rpcUrl: "https://rpc.example", programId });
  assert.equal(config.network, "mainnet-beta");
  assert.equal(config.rpcUrl, "https://rpc.example");
  assert.equal(config.programIdString, programId.toBase58());
});

test("explorer URLs include the correct cluster", () => {
  const devnet = getSolanaNetworkConfig({ network: "devnet" });
  assert.equal(explorerTransactionUrl("sig/1", devnet), "https://explorer.solana.com/tx/sig%2F1?cluster=devnet");
  const mainnet = getSolanaNetworkConfig({ network: "mainnet-beta" });
  assert.equal(explorerAccountUrl(programId, mainnet), `https://explorer.solana.com/address/${programId.toBase58()}`);
  const localnet = getSolanaNetworkConfig({ network: "localnet", rpcUrl: "http://127.0.0.1:8899" });
  assert.match(explorerTransactionUrl("signature", localnet), /cluster=custom&customUrl=http%3A%2F%2F127\.0\.0\.1%3A8899/);
});

test("transaction lifecycle mapping distinguishes submitted, confirmed, finalized, and failed", () => {
  assert.equal(lifecycleFromConfirmation("processed"), "submitted");
  assert.equal(lifecycleFromConfirmation("confirmed"), "confirmed");
  assert.equal(lifecycleFromConfirmation("finalized"), "finalized");
  assert.equal(lifecycleFromConfirmation("confirmed", new Error("rpc")), "failed");
  assert.equal(lifecycleFromRpcStatus({ confirmationStatus: "finalized", err: null }), "finalized");
  assert.equal(lifecycleFromRpcStatus({ confirmationStatus: "processed", err: { InstructionError: [0, "Custom"] } }), "failed");
});

test("instruction builders encode the Phase 3 commitment and enum boundaries", () => {
  const event = buildCreateEventInstruction({
    programId,
    creator: owner,
    eventType: "delivery",
    eventId: 7,
    eventIdentityCommitment: new Uint8Array(32).fill(7),
    evidenceCommitment: new Uint8Array(32).fill(8),
    deadlineSlot: 99,
    requiredWitnesses: 2,
    requiredAttestations: 2,
  });
  assert.equal(event.instruction.data.length, 8 + 1 + 8 + 32 + 32 + 8 + 2 + 2);

  const witness = buildRegisterWitnessInstruction({
    programId,
    owner,
    witnessId: new Uint8Array(32).fill(1),
    witnessType: "device",
    metadataCommitment: new Uint8Array(32).fill(2),
  });
  assert.equal(witness.instruction.data.length, 8 + 32 + 1 + 32);

  const attestation = buildSubmitAttestationInstruction({
    programId,
    submitter: owner,
    eventId: 7,
    witnessOwner: owner,
    witnessId: new Uint8Array(32).fill(1),
    result: "supports",
    observationCommitment: new Uint8Array(32).fill(3),
    evidenceCommitment: new Uint8Array(32).fill(4),
    witnessSignatureCommitment: new Uint8Array(32).fill(5),
    observationTimestamp: 1_700_000_000,
  });
  assert.equal(attestation.instruction.data.length, 8 + 1 + 32 + 32 + 32 + 8);
});

test("event instruction builders reject impossible witness thresholds", () => {
  assert.throws(() => buildCreateEventInstruction({
    programId,
    creator: owner,
    eventType: "delivery",
    eventId: 9,
    eventIdentityCommitment: new Uint8Array(32).fill(9),
    evidenceCommitment: new Uint8Array(32).fill(10),
    deadlineSlot: 99,
    requiredWitnesses: 3,
    requiredAttestations: 2,
  }), /requiredAttestations cannot be below requiredWitnesses/);
});
