import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getRuntimeConfig } from "./config";
import { errorPayload, toAppError } from "./errors";
import { consumeRateLimit } from "./rate-limit";

export interface RequestMeta {
  readonly requestId: string;
  readonly startedAt: number;
}

export interface RouteOptions {
  readonly rateLimit?: { max: number; windowMs: number };
  readonly name?: string;
}

export function withRoute<TContext = unknown>(
  handler: (request: NextRequest, context: TContext, meta: RequestMeta) => Promise<Response>,
  options: RouteOptions = {},
): (request: NextRequest, context: TContext) => Promise<Response> {
  return async (request, context) => {
    const requestId = request.headers.get("x-request-id")?.trim() || randomUUID();
    const startedAt = Date.now();
    let response: Response;
    try {
      const source = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
      const config = getRuntimeConfig();
      const rate = options.rateLimit ?? { max: config.rateLimitPerMinute, windowMs: 60_000 };
      const rateResult = consumeRateLimit(`${source}:${options.name ?? request.nextUrl.pathname}`, rate);
      response = await handler(request, context, { requestId, startedAt });
      response.headers.set("x-ratelimit-remaining", String(rateResult.remaining));
      response.headers.set("x-ratelimit-reset", new Date(rateResult.resetAt).toISOString());
    } catch (error) {
      const normalized = toAppError(error);
      response = NextResponse.json(errorPayload(normalized, requestId), { status: normalized.status });
    }
    response.headers.set("x-request-id", requestId);
    console.info(JSON.stringify({
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      status: response.status,
      durationMs: Date.now() - startedAt,
    }));
    return response;
  };
}

export function json<T>(data: T, init: ResponseInit = {}): NextResponse {
  return NextResponse.json(data, init);
}

export async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw toAppError(new SyntaxError("Request body must be valid JSON"));
  }
}
