import { NextRequest } from "next/server";
import { withRoute, json } from "@/server/http";
import { requireUser } from "@/server/auth/session";

export const GET = withRoute(async (request: NextRequest) => {
  const user = await requireUser(request);
  return json({ data: user });
}, { name: "auth-me" });
