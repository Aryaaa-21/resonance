import { commitmentFromText } from "./encoding";

/**
 * Phase 3 event identity domain. Phase 4 will standardize the full evidence
 * serialization; this helper only binds the protocol event nonce to its
 * creator and client timestamp so a database id is not the sole identity.
 */
export async function deriveEventIdentityCommitment(input: {
  creator: string;
  clientNonce: bigint | number | string;
  createdAtUnixSeconds: bigint | number | string;
}): Promise<Buffer> {
  const canonical = ["resonance:event:v1", input.creator, String(input.clientNonce), String(input.createdAtUnixSeconds)].join("|");
  return commitmentFromText(canonical);
}
