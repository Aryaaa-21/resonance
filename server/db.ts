import { PrismaClient } from "@prisma/client";
import { AppError } from "./errors";
import { getRuntimeConfig } from "./config";

const globalForPrisma = globalThis as unknown as { resonancePrisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  const { databaseUrl } = getRuntimeConfig();
  if (!databaseUrl) {
    throw AppError.databaseUnavailable("DATABASE_URL is not configured");
  }
  if (!globalForPrisma.resonancePrisma) {
    globalForPrisma.resonancePrisma = new PrismaClient();
  }
  return globalForPrisma.resonancePrisma;
}

export function databaseIsConfigured(): boolean {
  return Boolean(getRuntimeConfig().databaseUrl);
}

export async function checkDatabase(): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!databaseIsConfigured()) return { ok: false, message: "DATABASE_URL is not configured" };
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return { ok: true };
  } catch {
    return { ok: false, message: "Database connection failed" };
  }
}
