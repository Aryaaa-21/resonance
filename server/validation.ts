import { z } from "zod";

export const idSchema = z.string().trim().min(1).max(128);
export const eventCategorySchema = z.enum(["logistics", "location", "identity", "environmental", "security", "other"]);
export const eventTypeSchema = z.enum(["delivery", "location_arrival"]);
export const securityLevelSchema = z.enum(["standard", "elevated", "high", "critical"]);
export const eventStateSchema = z.enum(["unverified", "review", "verified", "challenged", "rejected"]);
export const eventLifecycleSchema = z.enum(["draft", "pending", "active", "processing", "completed", "failed", "archived"]);

export const locationSchema = z.object({
  label: z.string().trim().min(1).max(240),
  city: z.string().trim().min(1).max(120),
  region: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracyMeters: z.number().nonnegative().optional(),
  }).optional(),
  observationRadiusMeters: z.number().positive().max(1_000_000).optional(),
});

export const authSessionSchema = z.object({
  email: z.string().email().optional(),
  walletAddress: z.string().trim().min(16).max(128).optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
}).refine((value) => Boolean(value.email || value.walletAddress), { message: "An email or wallet address is required" });

export const verificationRequestCreateSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(4_000).optional(),
  category: eventCategorySchema,
  eventType: eventTypeSchema.optional(),
  location: locationSchema,
  requiredWitnesses: z.number().int().min(1).max(100).default(3),
  deadline: z.coerce.date().optional(),
  securityLevel: securityLevelSchema.default("standard"),
  planningStakeAmount: z.number().nonnegative().max(1_000_000_000).optional(),
  confidenceThreshold: z.number().min(0).max(100).optional(),
  preferredWitnessClasses: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
  occurredAt: z.coerce.date().optional(),
  projectId: idSchema.optional(),
});

export const verificationRequestUpdateSchema = verificationRequestCreateSchema.partial().extend({
  reviewNotes: z.string().trim().max(4_000).optional(),
});

export const eventUpdateSchema = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  description: z.string().trim().max(4_000).optional(),
  state: eventStateSchema.optional(),
  status: eventLifecycleSchema.optional(),
});

export const observationCreateSchema = z.object({
  witnessId: idSchema,
  kind: z.enum(["location", "timestamp", "device_signal", "image", "signature", "confirmation", "ai_analysis", "sensor", "statement", "external_signal", "other"]),
  summary: z.string().trim().min(1).max(4_000),
  payload: z.record(z.string(), z.unknown()).optional(),
  contentHash: z.string().trim().min(1).max(256).optional(),
  confidence: z.number().min(0).max(100).default(0),
  observedAt: z.coerce.date().optional(),
});

export const evidenceCreateSchema = z.object({
  witnessId: idSchema.optional(),
  observationId: idSchema.optional(),
  kind: z.enum(["location", "image", "signature", "sensor", "analysis", "other"]),
  label: z.string().trim().min(1).max(240),
  description: z.string().trim().max(4_000).optional(),
  collectedAt: z.coerce.date().optional(),
  contentHash: z.string().trim().min(1).max(256),
  artifactRef: z.string().trim().max(1_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  confidence: z.number().min(0).max(100).default(0),
});

export const challengeCreateSchema = z.object({
  stakeAmount: z.number().nonnegative().default(0),
  stakeSymbol: z.string().trim().min(1).max(16).default("USDC"),
  stakeReference: z.string().trim().min(1).max(240).optional(),
  reason: z.enum(["insufficient_evidence", "conflicting_observation", "suspected_fraud", "late_submission", "duplicate_claim"]),
  description: z.string().trim().min(1).max(4_000),
  reviewDeadline: z.coerce.date().optional(),
}).superRefine((value, context) => {
  if (value.stakeAmount > 0 && !value.stakeReference) {
    context.addIssue({ code: "custom", path: ["stakeReference"], message: "A stake reference is required when stakeAmount is greater than zero" });
  }
});

export const challengeUpdateSchema = z.object({
  status: z.enum(["pending", "under_review", "accepted", "rejected", "inconclusive", "open", "resolved", "dismissed", "expired"]).optional(),
  resolution: z.enum(["upheld", "dismissed", "withdrawn"]).nullable().optional(),
  description: z.string().trim().min(1).max(4_000).optional(),
});

export const witnessCreateSchema = z.object({
  userId: idSchema.optional(),
  projectId: idSchema.optional(),
  name: z.string().trim().min(1).max(160),
  kind: z.enum(["device", "human", "service", "iot", "ai_agent", "external_system"]),
  description: z.string().trim().max(4_000).optional(),
  location: locationSchema,
  status: z.enum(["active", "review", "offline", "suspended"]).default("offline"),
  stakeAmount: z.number().nonnegative().default(0),
  stakeSymbol: z.string().trim().min(1).max(16).default("USDC"),
});

export const witnessUpdateSchema = witnessCreateSchema.partial();

export function queryString(request: Request, key: string): string | undefined {
  return new URL(request.url).searchParams.get(key) ?? undefined;
}

export function booleanQuery(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}


export const protocolAttestationCreateSchema = z.object({
  mode: z.enum(["demo", "solana"]).default("demo"),
  integrityMode: z.enum(["legacy", "phase4"]).default("legacy"),
  eventNumber: z.union([z.string().regex(/^\d+$/), z.number().int().nonnegative()]).optional(),
  witnessOwner: z.string().trim().min(32).max(64).optional(),
  witnessId: z.string().trim().min(2).optional(),
  claim: z.boolean().default(true),
  result: z.enum(["supports", "refutes", "inconclusive"]).optional(),
  observationId: idSchema.optional(),
  evidenceIds: z.array(idSchema).min(1).max(256).optional(),
  observationCommitment: z.string().trim().min(2).optional(),
  observationTimestamp: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]).optional(),
  evidenceCommitment: z.string().trim().min(2).optional(),
  witnessSignature: z.string().trim().min(80).max(200).optional(),
  walletAddress: z.string().trim().min(32).max(64).optional(),
}).superRefine((value, context) => {
  if (value.mode === "solana") {
    for (const key of ["eventNumber", "witnessOwner", "witnessId", "walletAddress"] as const) {
      if (value[key] === undefined) context.addIssue({ code: "custom", path: [key], message: `${key} is required for Solana publication` });
    }
    if (value.integrityMode === "legacy" && value.evidenceCommitment === undefined) {
      context.addIssue({ code: "custom", path: ["evidenceCommitment"], message: "evidenceCommitment is required for legacy Solana publication" });
    }
    if (value.integrityMode === "phase4") {
      for (const key of ["observationId", "evidenceIds", "witnessSignature"] as const) {
        if (value[key] === undefined) context.addIssue({ code: "custom", path: [key], message: `${key} is required for Phase 4 integrity publication` });
      }
    }
  }
});

export const protocolAttestationSyncSchema = z.object({
  attestationId: idSchema,
  transactionSignature: z.string().trim().min(32).max(128),
});
