import { strict as assert } from "node:assert";
import test from "node:test";
import { shouldAdvanceCheckpoint } from "./checkpoint";

test("chain sync checkpoint advances only for a newer slot", () => {
  assert.equal(shouldAdvanceCheckpoint(null, { lastSlot: BigInt(10), lastSignature: "sig-10" }), true);
  assert.equal(shouldAdvanceCheckpoint({ lastSlot: BigInt(10), lastSignature: "sig-10" }, { lastSlot: BigInt(10), lastSignature: "retry" }), false);
  assert.equal(shouldAdvanceCheckpoint({ lastSlot: BigInt(10), lastSignature: "sig-10" }, { lastSlot: BigInt(9), lastSignature: "older" }), false);
  assert.equal(shouldAdvanceCheckpoint({ lastSlot: BigInt(10), lastSignature: "sig-10" }, { lastSlot: BigInt(11), lastSignature: "new" }), true);
});
