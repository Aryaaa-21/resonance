import { NextRequest } from "next/server";
import { withRoute, json } from "@/server/http";
import { getApplication } from "@/server/application/helpers";
import { parsePagination } from "@/server/pagination";

export const GET = withRoute(async (request: NextRequest) => {
  const url = new URL(request.url);
  const result = await getApplication().listAttestations(parsePagination(request), {
    eventId: url.searchParams.get("eventId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
  return json({ data: result.items, meta: result.meta });
}, { name: "attestations" });
