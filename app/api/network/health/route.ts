import { withRoute, json } from "@/server/http";
import { getApplication } from "@/server/application/helpers";

export const GET = withRoute(async () => json({ data: await getApplication().networkHealth() }), { name: "network-health" });
