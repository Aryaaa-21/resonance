import { NextRequest } from "next/server";
import { withRoute, readJson } from "@/server/http";
import { getApplication, executeMutation, requireActor } from "@/server/application/helpers";
import { protocolAttestationSyncSchema } from "@/server/validation";

export const POST = withRoute(async (request: NextRequest, _context, meta) => {
  const input = protocolAttestationSyncSchema.parse(await readJson(request));
  const actor = await requireActor(request);
  return executeMutation({
    request,
    scope: `attestations:${input.attestationId}:sync`,
    payload: input,
    requestId: meta.requestId,
    operation: async (requestId) => ({ body: await getApplication().syncProtocolAttestation(input, actor, requestId), status: 200 }),
  });
}, { name: "attestation-sync", rateLimit: { max: 30, windowMs: 60_000 } });
