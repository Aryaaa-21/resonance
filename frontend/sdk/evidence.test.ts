import { strict as assert } from "node:assert";
import { generateKeyPairSync, sign, type KeyObject } from "node:crypto";
import test from "node:test";
import bs58 from "bs58";
import { buildEvidenceIntegrity, buildEvidenceSetIntegrity, buildObservationIntegrity, verifyAttestationIntegrity } from "../server/services/integrity";
import { canonicalize, verifyWitnessSignature, witnessSignatureMessage, witnessSignatureCommitment } from "./evidence";

const witnessId = "11".repeat(32);

function publicKeyBase58(publicKey: KeyObject): string {
  const der = publicKey.export({ format: "der", type: "spki" });
  return bs58.encode(der.subarray(der.length - 32));
}

test("canonicalization is stable across object insertion order", () => {
  assert.equal(canonicalize({ b: 2, a: 1, nested: { z: true, x: null } }), '{"a":1,"b":2,"nested":{"x":null,"z":true}}');
});

test("Phase 4 commitments and Ed25519 witness signatures verify", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const witnessOwner = publicKeyBase58(publicKey);
  const observation = { eventId: "evt_phase4", witnessId: "wit_phase4", kind: "statement", summary: "Observed package handoff", payload: { source: "sensor-1", count: 1 }, contentHash: "sha256:raw-observation", observedAt: new Date("2026-10-23T08:00:00.000Z") };
  const evidence = [{ kind: "image", label: "handoff image", description: "metadata only", collectedAt: new Date("2026-10-23T08:00:01.000Z"), contentHash: "sha256:raw-artifact", storageReference: "s3://bucket/object-1", metadata: { mime: "image/jpeg" } }];
  const observationIntegrity = await buildObservationIntegrity(observation);
  const evidenceIntegrity = await buildEvidenceSetIntegrity(evidence);
  const message = witnessSignatureMessage({ eventNumber: 42, witnessOwner, witnessId, observationCommitment: observationIntegrity.commitment, evidenceCommitment: evidenceIntegrity.commitment });
  const signature = sign(null, Buffer.from(message), privateKey);
  const signatureCommitment = await witnessSignatureCommitment(signature);
  assert.equal(await verifyWitnessSignature({ witnessOwner, message, signature }), true);
  const result = await verifyAttestationIntegrity({ protocolEventNumber: 42, witnessOwner, witnessId, observation, evidence: evidence.map((record) => ({ ...record, evidenceCommitment: evidenceIntegrity.leaves[0].commitment })), expectedObservationCommitment: observationIntegrity.commitment, expectedEvidenceCommitment: evidenceIntegrity.commitment, witnessSignature: signature, expectedWitnessSignatureCommitment: signatureCommitment });
  assert.equal(result.verified, true);
  assert.equal(result.tampered, false);
});

test("tampering with committed metadata is detected", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const witnessOwner = publicKeyBase58(publicKey);
  const observation = { eventId: "evt_tamper", witnessId: "wit_tamper", kind: "statement", summary: "Original", payload: null, contentHash: "sha256:obs", observedAt: new Date("2026-10-23T08:00:00.000Z"), observationCommitment: (await buildObservationIntegrity({ eventId: "evt_tamper", witnessId: "wit_tamper", kind: "statement", summary: "Original", payload: null, contentHash: "sha256:obs", observedAt: new Date("2026-10-23T08:00:00.000Z") })).commitment };
  const evidence = [{ kind: "document", label: "original", description: null, collectedAt: new Date("2026-10-23T08:00:01.000Z"), contentHash: "sha256:file", storageReference: "ipfs://cid", metadata: null }];
  const evidenceIntegrity = await buildEvidenceSetIntegrity(evidence);
  const message = witnessSignatureMessage({ eventNumber: 9, witnessOwner, witnessId, observationCommitment: observation.observationCommitment, evidenceCommitment: evidenceIntegrity.commitment });
  const signature = sign(null, Buffer.from(message), privateKey);
  const result = await verifyAttestationIntegrity({ protocolEventNumber: 9, witnessOwner, witnessId, observation, evidence: [{ ...evidence[0], label: "tampered", evidenceCommitment: evidenceIntegrity.leaves[0].commitment }], expectedObservationCommitment: observation.observationCommitment, expectedEvidenceCommitment: evidenceIntegrity.commitment, witnessSignature: signature, expectedWitnessSignatureCommitment: await witnessSignatureCommitment(signature) });
  assert.equal(result.verified, false);
  assert.equal(result.tampered, true);
  assert.match(result.reasons.join("; "), /metadata was modified/);
});
