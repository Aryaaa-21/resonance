import { NextRequest } from "next/server";
import { withRoute, json, readJson } from "@/server/http";
import { getApplication, executeMutation, requireActor } from "@/server/application/helpers";
import { challengeUpdateSchema } from "@/server/validation";

type Context = { params: Promise<{ id: string }> };

export const GET = withRoute(async (_request, context: Context) => {
  const { id } = await context.params;
  return json({ data: await getApplication().getChallenge(id) });
}, { name: "challenge-detail" });

export const PATCH = withRoute(async (request: NextRequest, context: Context, meta) => {
  const { id } = await context.params;
  const input = challengeUpdateSchema.parse(await readJson(request));
  const actor = await requireActor(request);
  return executeMutation({ request, scope: `challenges:${id}:update`, payload: input, requestId: meta.requestId, operation: async (requestId) => ({ body: await getApplication().updateChallenge(id, input, actor, requestId), status: 200 }) });
}, { name: "challenge-write", rateLimit: { max: 30, windowMs: 60_000 } });
