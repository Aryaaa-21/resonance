import { NextRequest } from "next/server";
import { withRoute, json, readJson } from "@/server/http";
import { getApplication, executeMutation, requireActor } from "@/server/application/helpers";
import { challengeCreateSchema } from "@/server/validation";

type Context = { params: Promise<{ id: string }> };

export const POST = withRoute(async (request: NextRequest, context: Context, meta) => {
  const { id } = await context.params;
  const input = challengeCreateSchema.parse(await readJson(request));
  const actor = await requireActor(request);
  return executeMutation({ request, scope: `events:${id}:challenges:create`, payload: input, requestId: meta.requestId, operation: async (requestId) => ({ body: await getApplication().createChallenge(id, input, actor, requestId), status: 201 }) });
}, { name: "event-challenge-write", rateLimit: { max: 30, windowMs: 60_000 } });
