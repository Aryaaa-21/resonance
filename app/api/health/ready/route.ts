import { withRoute, json } from "@/server/http";
import { checkDatabase } from "@/server/db";

export const GET = withRoute(async (_request, _context, meta) => {
  const database = await checkDatabase();
  if (!database.ok) return json({ error: { code: "DATABASE_UNAVAILABLE", message: database.message, requestId: meta.requestId } }, { status: 503 });
  return json({ data: { status: "ready", database: "connected", requestId: meta.requestId } });
}, { name: "health-ready" });
