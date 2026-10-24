import { NextRequest } from "next/server";
import { withRoute, json, readJson } from "@/server/http";
import { getApplication, executeMutation, requireActor } from "@/server/application/helpers";
import { eventUpdateSchema } from "@/server/validation";

type Context = { params: Promise<{ id: string }> };

export const GET = withRoute(async (_request, context: Context) => {
  const { id } = await context.params;
  return json({ data: await getApplication().getEvent(id) });
}, { name: "event-detail" });

export const PATCH = withRoute(async (request: NextRequest, context: Context, meta) => {
  const { id } = await context.params;
  const input = eventUpdateSchema.parse(await readJson(request));
  const actor = await requireActor(request);
  return executeMutation({ request, scope: `events:${id}:update`, payload: input, requestId: meta.requestId, operation: async (requestId) => ({ body: await getApplication().updateEvent(id, input, actor, requestId), status: 200 }) });
}, { name: "event-write", rateLimit: { max: 30, windowMs: 60_000 } });
