import { NextRequest } from "next/server";
import { withRoute, json } from "@/server/http";
import { parsePagination } from "@/server/pagination";
import { getApplication } from "@/server/application/helpers";

export const GET = withRoute(async (request: NextRequest) => {
  const url = new URL(request.url);
  const result = await getApplication().listAlerts(parsePagination(request), { eventId: url.searchParams.get("eventId") ?? undefined, severity: url.searchParams.get("severity") ?? undefined, status: url.searchParams.get("status") ?? undefined });
  return json({ data: result.items, meta: result.meta, advisoryOnly: true });
}, { name: "ai-alerts" });
