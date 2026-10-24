import { strict as assert } from "node:assert";
import test from "node:test";
import { deriveEventIdentityCommitment } from "./identity";

test("event identity commitment is deterministic and domain separated", async () => {
  const input = { creator: "creator-1", clientNonce: 7, createdAtUnixSeconds: 1_700_000_000 };
  const first = await deriveEventIdentityCommitment(input);
  const second = await deriveEventIdentityCommitment(input);
  const differentNonce = await deriveEventIdentityCommitment({ ...input, clientNonce: 8 });
  assert.equal(first.length, 32);
  assert.deepEqual(first, second);
  assert.notDeepEqual(first, differentNonce);
});
