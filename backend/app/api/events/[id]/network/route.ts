import { withRoute, json } from "@/server/http";
import { getApplication } from "@/server/application/helpers";

type Context = { params: Promise<{ id: string }> };
export const GET = withRoute(async (_request, context: Context) => {
  const { id } = await context.params;
  return json({ data: await getApplication().eventNetwork(id) });
}, { name: "event-network" });
