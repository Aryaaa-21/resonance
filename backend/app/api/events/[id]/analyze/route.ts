import { NextRequest } from "next/server";
import { withRoute, json } from "@/server/http";
import { getApplication, executeMutation, requireActor } from "@/server/application/helpers";

type Context = { params: Promise<{ id: string }> };
export const POST = withRoute(async (request: NextRequest, context: Context, meta) => {
  const { id } = await context.params;
  const actor = await requireActor(request);
  return executeMutation({ request, scope: `events:${id}:analyze`, payload: { eventId: id }, requestId: meta.requestId, operation: async (requestId) => ({ body: await getApplication().analyzeEvent(id, actor, requestId), status: 200 }) });
}, { name: "event-analysis-write", rateLimit: { max: 20, windowMs: 60_000 } });
