import { z } from "zod";
import { getSolanaNetworkConfig, type SolanaNetwork, type SolanaNetworkConfig } from "@/sdk/network";

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}, z.boolean());

const environmentSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  RES_DEMO_MODE: booleanFromEnv.optional(),
  RES_SESSION_TTL_SECONDS: z.coerce.number().int().positive().max(2_592_000).optional(),
  RES_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().max(10_000).optional(),
  RES_SESSION_COOKIE: z.string().min(1).optional(),
  SOLANA_PROTOCOL_ADAPTER: z.enum(["demo", "solana"]).optional(),
  SOLANA_NETWORK: z.string().optional(),
  SOLANA_RPC_URL: z.string().url().optional(),
  SOLANA_PROGRAM_ID: z.string().min(32).optional(),
  SOLANA_EXPLORER_URL: z.string().url().optional(),
  SOLANA_COMMITMENT: z.enum(["processed", "confirmed", "finalized"]).optional(),
});

export interface RuntimeConfig {
  readonly databaseUrl: string | undefined;
  readonly demoMode: boolean;
  readonly sessionTtlSeconds: number;
  readonly rateLimitPerMinute: number;
  readonly sessionCookie: string;
  readonly nodeEnv: string;
  readonly solana: SolanaNetworkConfig;
  readonly solanaAdapter: "demo" | "solana";
  readonly solanaCommitment: "processed" | "confirmed" | "finalized";
}

export function getRuntimeConfig(): RuntimeConfig {
  const parsed = environmentSchema.safeParse(process.env);
  const values = parsed.success ? parsed.data : {};
  const nodeEnv = process.env.NODE_ENV ?? "development";
  return {
    databaseUrl: values.DATABASE_URL?.trim() || undefined,
    demoMode: values.RES_DEMO_MODE ?? nodeEnv !== "production",
    sessionTtlSeconds: values.RES_SESSION_TTL_SECONDS ?? 86_400,
    rateLimitPerMinute: values.RES_RATE_LIMIT_PER_MINUTE ?? 120,
    sessionCookie: values.RES_SESSION_COOKIE ?? "resonance_session",
    nodeEnv,
    solana: getSolanaNetworkConfig({ network: values.SOLANA_NETWORK, rpcUrl: values.SOLANA_RPC_URL, programId: values.SOLANA_PROGRAM_ID, explorerBaseUrl: values.SOLANA_EXPLORER_URL }),
    solanaAdapter: values.SOLANA_PROTOCOL_ADAPTER ?? "demo",
    solanaCommitment: values.SOLANA_COMMITMENT ?? "confirmed",
  };
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getRuntimeConfig().databaseUrl);
}
