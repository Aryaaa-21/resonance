import { NextRequest } from "next/server";
import { withRoute, json, readJson } from "@/server/http";
import { parsePagination } from "@/server/pagination";
import { getApplication, executeMutation, requireActor } from "@/server/application/helpers";
import { verificationRequestCreateSchema } from "@/server/validation";

export const GET = withRoute(async (request: NextRequest) => {
  const app = getApplication();
  const url = new URL(request.url);
  const result = await app.listVerificationRequests(parsePagination(request), { status: url.searchParams.get("status") ?? undefined, requestedById: url.searchParams.get("requestedById") ?? undefined });
  return json({ data: result.items, meta: result.meta });
}, { name: "verification-requests" });

export const POST = withRoute(async (request: NextRequest, _context, meta) => {
  const input = verificationRequestCreateSchema.parse(await readJson(request));
  const actor = await requireActor(request);
  return executeMutation({ request, scope: "verification-requests:create", payload: input, requestId: meta.requestId, operation: async (requestId) => ({ body: await getApplication().createVerificationRequest(input, actor, requestId), status: 201 }) });
}, { name: "verification-requests-write", rateLimit: { max: 30, windowMs: 60_000 } });
