import { NextRequest, NextResponse } from "next/server";
import { createOrchestrator, ResonanceOrchestrator } from "./orchestrator";
import { getPrisma } from "../db";
import { requireUser } from "../auth/session";
import { executeIdempotent, requireIdempotencyKey } from "../idempotency";
import { json } from "../http";

export function getApplication(): ResonanceOrchestrator {
  return createOrchestrator(getPrisma());
}

export async function requireActor(request: NextRequest) {
  return requireUser(request);
}

export async function executeMutation<T>(input: {
  request: NextRequest;
  scope: string;
  payload: unknown;
  operation: (requestId: string) => Promise<{ body: T; status: number }>;
  requestId: string;
}): Promise<NextResponse> {
  const db = getPrisma();
  const key = requireIdempotencyKey(input.request);
  const result = await executeIdempotent({ db, scope: input.scope, key, payload: input.payload, operation: () => input.operation(input.requestId) });
  const response = json({ data: result.body, meta: { replayed: result.replayed } }, { status: result.status });
  response.headers.set("x-idempotency-replayed", String(result.replayed));
  return response;
}
