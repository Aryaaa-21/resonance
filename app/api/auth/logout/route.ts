import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http";
import { clearSessionCookie, revokeSession } from "@/server/auth/session";

export const POST = withRoute(async (request: NextRequest) => {
  await revokeSession(request);
  const response = NextResponse.json({ data: { loggedOut: true } });
  clearSessionCookie(response);
  return response;
}, { name: "auth-logout" });
