import { NextRequest } from "next/server";
import { withRoute, json, readJson } from "@/server/http";
import { parsePagination } from "@/server/pagination";
import { getApplication, executeMutation, requireActor } from "@/server/application/helpers";
import { witnessCreateSchema } from "@/server/validation";

export const GET = withRoute(async (request: NextRequest) => {
  const url = new URL(request.url);
  const result = await getApplication().listWitnesses(parsePagination(request), { kind: url.searchParams.get("kind") ?? undefined, status: url.searchParams.get("status") ?? undefined });
  return json({ data: result.items, meta: result.meta });
}, { name: "witnesses" });

export const POST = withRoute(async (request: NextRequest, _context, meta) => {
  const input = witnessCreateSchema.parse(await readJson(request));
  const actor = await requireActor(request);
  return executeMutation({ request, scope: "witnesses:create", payload: input, requestId: meta.requestId, operation: async (requestId) => ({ body: await getApplication().createWitness(input, actor, requestId), status: 201 }) });
}, { name: "witnesses-write", rateLimit: { max: 30, windowMs: 60_000 } });
