import { NextRequest } from "next/server";
import { withRoute, json, readJson } from "@/server/http";
import { parsePagination } from "@/server/pagination";
import { getApplication, executeMutation, requireActor } from "@/server/application/helpers";
import { evidenceCreateSchema } from "@/server/validation";

type Context = { params: Promise<{ id: string }> };

export const GET = withRoute(async (request: NextRequest, context: Context) => {
  const { id } = await context.params;
  const result = await getApplication().listEvidence(id, parsePagination(request));
  return json({ data: result.items, meta: result.meta });
}, { name: "event-evidence" });

export const POST = withRoute(async (request: NextRequest, context: Context, meta) => {
  const { id } = await context.params;
  const input = evidenceCreateSchema.parse(await readJson(request));
  const actor = await requireActor(request);
  return executeMutation({ request, scope: `events:${id}:evidence:create`, payload: input, requestId: meta.requestId, operation: async (requestId) => ({ body: await getApplication().createEvidence(id, input, actor, requestId), status: 201 }) });
}, { name: "event-evidence-write", rateLimit: { max: 60, windowMs: 60_000 } });
