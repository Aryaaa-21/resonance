import { NextRequest } from "next/server";
import { withRoute } from "@/server/http";
import { getApplication, executeMutation, requireActor } from "@/server/application/helpers";

type Context = { params: Promise<{ id: string }> };

export const POST = withRoute(async (request: NextRequest, context: Context, meta) => {
  const { id } = await context.params;
  const actor = await requireActor(request);
  return executeMutation({ request, scope: `verification-requests:${id}:cancel`, payload: { id }, requestId: meta.requestId, operation: async (requestId) => ({ body: await getApplication().cancelVerificationRequest(id, actor, requestId), status: 200 }) });
}, { name: "verification-request-cancel", rateLimit: { max: 30, windowMs: 60_000 } });
