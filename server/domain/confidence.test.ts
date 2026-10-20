import assert from "node:assert/strict";
import test from "node:test";
import { calculateConfidence } from "./confidence";

test("confidence calculation is deterministic and bounded", () => {
  const input = { observations: [{ confidence: 80, witnessId: "w1" }, { confidence: 60, witnessId: "w2" }], evidence: [{ confidence: 70, status: "verified" }] };
  const first = calculateConfidence(input);
  const second = calculateConfidence(input);
  assert.deepEqual(first, second);
  assert.equal(first.score, 73);
  assert.ok(first.score >= 0 && first.score <= 100);
});
