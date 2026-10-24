import { NextRequest } from "next/server";
import { withRoute, json, readJson } from "@/server/http";
import { parsePagination } from "@/server/pagination";
import { getApplication, executeMutation, requireActor } from "@/server/application/helpers";
import { observationCreateSchema } from "@/server/validation";

type Context = { params: Promise<{ id: string }> };

export const GET = withRoute(async (request: NextRequest, context: Context) => {
  const { id } = await context.params;
  const result = await getApplication().listObservations(id, parsePagination(request));
  return json({ data: result.items, meta: result.meta });
}, { name: "event-observations" });

export const POST = withRoute(async (request: NextRequest, context: Context, meta) => {
  const { id } = await context.params;
  const input = observationCreateSchema.parse(await readJson(request));
  const actor = await requireActor(request);
  return executeMutation({ request, scope: `events:${id}:observations:create`, payload: input, requestId: meta.requestId, operation: async (requestId) => ({ body: await getApplication().createObservation(id, input, actor, requestId), status: 201 }) });
}, { name: "event-observations-write", rateLimit: { max: 60, windowMs: 60_000 } });
