import { NextRequest, NextResponse } from "next/server";
import { withRoute, json, readJson } from "@/server/http";
import { getRuntimeConfig } from "@/server/config";
import { databaseIsConfigured, getPrisma } from "@/server/db";
import { authSessionSchema } from "@/server/validation";
import { createSession, getCurrentUser, revokeSession, setSessionCookie, clearSessionCookie } from "@/server/auth/session";
import { executeIdempotent, InMemoryIdempotencyStore, requireIdempotencyKey } from "@/server/idempotency";

const demoAuthIdempotency = new InMemoryIdempotencyStore();

export const GET = withRoute(async (request: NextRequest) => {
  const user = await getCurrentUser(request);
  return json({ data: { authenticated: Boolean(user), user, demoMode: getRuntimeConfig().demoMode } });
}, { name: "auth-session" });

export const POST = withRoute(async (request: NextRequest) => {
  const input = authSessionSchema.parse(await readJson(request));
  if (!databaseIsConfigured() && !getRuntimeConfig().demoMode) await createSession(input);
  const key = requireIdempotencyKey(request);
  const result = databaseIsConfigured()
    ? await executeIdempotent({ db: getPrisma(), scope: "auth:session", key, payload: input, operation: async () => ({ body: await createSession(input), status: 201 }) })
    : await demoAuthIdempotency.execute("auth:session", key, input, async () => ({ body: await createSession(input), status: 201 }));
  const response = json({ data: { user: result.body.user, demoMode: getRuntimeConfig().demoMode }, meta: { replayed: result.replayed } }, { status: result.status });
  response.headers.set("x-idempotency-replayed", String(result.replayed));
  setSessionCookie(response, result.body.token);
  return response;
}, { name: "auth-session", rateLimit: { max: 30, windowMs: 60_000 } });

export const DELETE = withRoute(async (request: NextRequest) => {
  await revokeSession(request);
  const response = NextResponse.json({ data: { loggedOut: true } });
  clearSessionCookie(response);
  return response;
}, { name: "auth-session" });
