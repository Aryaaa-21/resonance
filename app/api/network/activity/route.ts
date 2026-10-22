import { NextRequest } from "next/server";
import { withRoute, json } from "@/server/http";
import { parsePagination } from "@/server/pagination";
import { getApplication } from "@/server/application/helpers";

export const GET = withRoute(async (request: NextRequest) => {
  const result = await getApplication().networkActivity(parsePagination(request));
  return json({ data: result.items, meta: result.meta });
}, { name: "network-activity" });
