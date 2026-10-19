import { createHash } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "./errors";

export interface IdempotentResult<T> {
  readonly body: T;
  readonly status: number;
  readonly replayed: boolean;
}

function canonicalize(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${canonicalize(nested)}`).join(",")}}`;
}

export function requestHash(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

export function requireIdempotencyKey(request: Request): string {
  const value = request.headers.get("idempotency-key")?.trim();
  if (!value || value.length > 200) throw AppError.idempotencyRequired();
  return value;
}

export async function executeIdempotent<T>(input: {
  db: PrismaClient;
  scope: string;
  key: string;
  payload: unknown;
  operation: () => Promise<{ body: T; status: number }>;
}): Promise<IdempotentResult<T>> {
  const hash = requestHash(input.payload);
  const expiresAt = new Date(Date.now() + 86_400_000);
  let record;
  try {
    record = await input.db.idempotencyKey.create({
      data: { scope: input.scope, key: input.key, requestHash: hash, expiresAt },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const existing = await input.db.idempotencyKey.findUnique({ where: { scope_key: { scope: input.scope, key: input.key } } });
    if (!existing) throw error;
    if (existing.requestHash !== hash) throw AppError.idempotencyConflict("The idempotency key was reused with a different request payload");
    if (existing.status === "COMPLETED" && existing.responseBody !== null && existing.responseCode !== null) {
      return { body: existing.responseBody as T, status: existing.responseCode, replayed: true };
    }
    throw AppError.idempotencyConflict("A request with this idempotency key is already in progress");
  }

  try {
    const result = await input.operation();
    await input.db.idempotencyKey.update({
      where: { id: record.id },
      data: { status: "COMPLETED", responseCode: result.status, responseBody: result.body as Prisma.InputJsonValue, completedAt: new Date() },
    });
    return { ...result, replayed: false };
  } catch (error) {
    await input.db.idempotencyKey.delete({ where: { id: record.id } }).catch(() => undefined);
    throw error;
  }
}

/** Small pure in-memory implementation used by unit tests and local adapters. */
export class InMemoryIdempotencyStore {
  private readonly records = new Map<string, { hash: string; result: { body: unknown; status: number } }>();

  async execute<T>(scope: string, key: string, payload: unknown, operation: () => Promise<{ body: T; status: number }>): Promise<IdempotentResult<T>> {
    const compoundKey = `${scope}:${key}`;
    const hash = requestHash(payload);
    const existing = this.records.get(compoundKey);
    if (existing) {
      if (existing.hash !== hash) throw AppError.idempotencyConflict("The idempotency key was reused with a different request payload");
      return { ...(existing.result as { body: T; status: number }), replayed: true };
    }
    const result = await operation();
    this.records.set(compoundKey, { hash, result });
    return { ...result, replayed: false };
  }
}
