import { withRoute, json } from "@/server/http";
import { getApplication } from "@/server/application/helpers";

type Context = { params: Promise<{ id: string }> };

/** Recomputes Phase 4 commitments/signature and independently checks the anchored transaction. */
export const GET = withRoute(async (_request, context: Context, meta) => {
  const { id } = await context.params;
  return json({ data: await getApplication().verifyProtocolAttestation(id, meta.requestId) });
}, { name: "attestation-independent-verification" });
