import { withRoute, json } from "@/server/http";
import openapi from "@/server/openapi.json";

export const GET = withRoute(async () => json(openapi), { name: "openapi" });
