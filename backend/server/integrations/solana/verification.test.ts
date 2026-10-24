import { strict as assert } from "node:assert";
import test from "node:test";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";
import { verifyAttestationAccount, verifyProtocolTransaction } from "./solana-adapter";
import type { ProtocolSyncExpectation } from "./types";

const programId = new PublicKey("Cp1QZyTidu8ZFj5tcYNEw2Z7fJTBmAR6gA8vnzQHNKbT");
const keys = [
  programId,
  new PublicKey("11111111111111111111111111111111"),
  new PublicKey("So11111111111111111111111111111111111111112"),
  new PublicKey("Vote111111111111111111111111111111111111111"),
  new PublicKey("Sysvar1111111111111111111111111111111111111"),
  new PublicKey("Stake11111111111111111111111111111111111111"),
];
const signature = bs58.encode(new Uint8Array(64).fill(7));
const data = Uint8Array.from([1, 2, 3, 4]);
const expected: ProtocolSyncExpectation = {
  programId: programId.toBase58(),
  eventPda: keys[1].toBase58(),
  witnessPda: keys[2].toBase58(),
  attestationPda: keys[3].toBase58(),
  instructionData: Buffer.from(data).toString("base64"),
  instructionAccounts: keys.slice(1).map((key) => key.toBase58()),
  submitter: keys[5].toBase58(),
};

function transaction(overrides: Record<string, unknown> = {}) {
  const message = {
    compiledInstructions: [{ programIdIndex: 0, accountKeyIndexes: [1, 2, 3, 4, 5], data }],
    getAccountKeys: () => ({ get: (index: number) => keys[index], length: keys.length }),
    isAccountSigner: (index: number) => index === 5,
  };
  return {
    transaction: { signatures: [signature], message },
    meta: { err: null },
    ...overrides,
  };
}

test("transaction verification accepts the prepared instruction envelope", () => {
  assert.deepEqual(verifyProtocolTransaction(transaction(), signature, expected), { ok: true });
});

test("transaction verification rejects changed arguments", () => {
  const changed = transaction({ transaction: { signatures: [signature], message: { ...transaction().transaction.message, compiledInstructions: [{ programIdIndex: 0, accountKeyIndexes: [1, 2, 3, 4, 5], data: Uint8Array.from([9]) }] } } });
  const result = verifyProtocolTransaction(changed, signature, expected);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /arguments/);
});

test("transaction verification rejects a non-signer submitter", () => {
  const changed = transaction({ transaction: { signatures: [signature], message: { ...transaction().transaction.message, isAccountSigner: () => false } } });
  const result = verifyProtocolTransaction(changed, signature, expected);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /signer/);
});


test("attestation account verification checks on-chain integrity commitments", () => {
  const event = keys[1];
  const witness = keys[2];
  const submitter = keys[5];
  const data = Buffer.alloc(218);
  event.toBytes().forEach((value, index) => data[8 + index] = value);
  witness.toBytes().forEach((value, index) => data[40 + index] = value);
  submitter.toBytes().forEach((value, index) => data[72 + index] = value);
  data[104] = 0;
  data.fill(0x31, 105, 137);
  data.fill(0x32, 137, 169);
  data.fill(0x33, 169, 201);
  data.writeBigInt64LE(BigInt(1_700_000_000), 201);
  data.writeBigUInt64LE(BigInt(123), 209);
  data[217] = 1;
  const result = verifyAttestationAccount({ owner: programId, data }, { programId: programId.toBase58(), eventPda: event.toBase58(), witnessPda: witness.toBase58(), submitter: submitter.toBase58(), observationCommitment: "31".repeat(32), evidenceCommitment: "32".repeat(32), witnessSignatureCommitment: "33".repeat(32) });
  assert.deepEqual(result, { ok: true });
});

test("attestation account verification rejects tampered on-chain commitments", () => {
  const data = Buffer.alloc(218);
  keys[1].toBytes().forEach((value, index) => data[8 + index] = value);
  keys[2].toBytes().forEach((value, index) => data[40 + index] = value);
  keys[5].toBytes().forEach((value, index) => data[72 + index] = value);
  data[104] = 0;
  data.fill(0x31, 105, 137);
  data.fill(0x99, 137, 169);
  data.fill(0x33, 169, 201);
  const result = verifyAttestationAccount({ owner: programId, data }, { programId: programId.toBase58(), eventPda: keys[1].toBase58(), witnessPda: keys[2].toBase58(), submitter: keys[5].toBase58(), evidenceCommitment: "32".repeat(32) });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /evidence commitment/);
});
