import { NextRequest } from "next/server";
import { withRoute, readJson } from "@/server/http";
import { getApplication, executeMutation, requireActor } from "@/server/application/helpers";
import { protocolAttestationCreateSchema } from "@/server/validation";

type Context = { params: Promise<{ id: string }> };

export const POST = withRoute(async (request: NextRequest, context: Context, meta) => {
  const { id } = await context.params;
  const input = protocolAttestationCreateSchema.parse(await readJson(request));
  const actor = await requireActor(request);
  return executeMutation<unknown>({
    request,
    scope: `events:${id}:attestation`,
    payload: input,
    requestId: meta.requestId,
    operation: async (requestId) => {
      if (input.mode === "solana") {
        return { body: await getApplication().prepareProtocolAttestation(id, { integrityMode: input.integrityMode, eventNumber: input.eventNumber!, witnessOwner: input.witnessOwner!, witnessId: input.witnessId!, claim: input.claim, result: input.result, observationId: input.observationId, evidenceIds: input.evidenceIds, observationCommitment: input.observationCommitment, observationTimestamp: input.observationTimestamp, evidenceCommitment: input.evidenceCommitment, witnessSignature: input.witnessSignature, walletAddress: input.walletAddress! }, actor, requestId), status: 201 };
      }
      return { body: await getApplication().publishDemoAttestation(id, actor, requestId), status: 201 };
    },
  });
}, { name: "event-attestation-write", rateLimit: { max: 10, windowMs: 60_000 } });
