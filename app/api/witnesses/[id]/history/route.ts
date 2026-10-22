import { NextRequest } from "next/server";
import { withRoute, json } from "@/server/http";
import { parsePagination } from "@/server/pagination";
import { getApplication } from "@/server/application/helpers";

type Context = { params: Promise<{ id: string }> };
export const GET = withRoute(async (request: NextRequest, context: Context) => {
  const { id } = await context.params;
  const result = await getApplication().witnessHistory(id, parsePagination(request));
  return json({ data: result.items, meta: result.meta });
}, { name: "witness-history" });
