import { NextRequest } from "next/server";
import { withRoute, json } from "@/server/http";
import { parsePagination } from "@/server/pagination";
import { getApplication } from "@/server/application/helpers";

export const GET = withRoute(async (request: NextRequest) => {
  const url = new URL(request.url);
  const result = await getApplication().listEvents(parsePagination(request), { category: url.searchParams.get("category") ?? undefined, status: url.searchParams.get("status") ?? undefined, state: url.searchParams.get("state") ?? undefined });
  return json({ data: result.items, meta: result.meta });
}, { name: "events" });
