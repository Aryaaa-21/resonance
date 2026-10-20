import assert from "node:assert/strict";
import test from "node:test";
import { challengeCreateSchema, verificationRequestCreateSchema } from "./validation";

const baseChallenge = {
  reason: "insufficient_evidence" as const,
  description: "The submitted evidence does not cover the claimed observation.",
};

test("challenge validation requires a stake reference for a positive stake", () => {
  const withoutReference = challengeCreateSchema.safeParse({ ...baseChallenge, stakeAmount: 2.5, stakeSymbol: "USDC" });
  assert.equal(withoutReference.success, false);
  if (!withoutReference.success) {
    assert.equal(withoutReference.error.issues[0]?.path[0], "stakeReference");
  }

  const withReference = challengeCreateSchema.safeParse({ ...baseChallenge, stakeAmount: 2.5, stakeSymbol: "USDC", stakeReference: "demo://stake/challenge-1" });
  assert.equal(withReference.success, true);
});

test("challenge validation permits an unstaked challenge without a reference", () => {
  const result = challengeCreateSchema.safeParse(baseChallenge);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.stakeAmount, 0);
    assert.equal(result.data.stakeSymbol, "USDC");
  }
});


test("verification request validation preserves the application observation radius", () => {
  const result = verificationRequestCreateSchema.safeParse({
    title: "Arrival",
    category: "location",
    eventType: "location_arrival",
    location: { label: "Austin drop zone", city: "Austin", region: "TX", country: "US", observationRadiusMeters: 125 },
    requiredWitnesses: 7,
    securityLevel: "high",
    planningStakeAmount: 3.5,
    confidenceThreshold: 92,
    preferredWitnessClasses: ["GPS device", "Camera"],
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.location.observationRadiusMeters, 125);
    assert.equal(result.data.requiredWitnesses, 7);
    assert.equal(result.data.securityLevel, "high");
    assert.equal(result.data.planningStakeAmount, 3.5);
    assert.equal(result.data.confidenceThreshold, 92);
    assert.deepEqual(result.data.preferredWitnessClasses, ["GPS device", "Camera"]);
  }
});
