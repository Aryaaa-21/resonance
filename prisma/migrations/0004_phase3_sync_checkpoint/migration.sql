-- Phase 3: retain only the expected instruction envelope and a monotonic sync checkpoint.
-- This is a small application boundary, not a durable production indexer.
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "expectedSubmitter" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "expectedInstructionData" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "expectedInstructionAccounts" JSONB;

CREATE TABLE IF NOT EXISTS "ChainSyncCheckpoint" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "lastSlot" BIGINT,
    "lastSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChainSyncCheckpoint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ChainSyncCheckpoint_network_programId_key" ON "ChainSyncCheckpoint"("network", "programId");
CREATE INDEX IF NOT EXISTS "ChainSyncCheckpoint_network_updatedAt_idx" ON "ChainSyncCheckpoint"("network", "updatedAt");
