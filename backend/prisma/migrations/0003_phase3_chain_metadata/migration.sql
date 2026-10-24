-- Phase 3: nullable chain metadata is additive so existing Phase 2/demo rows remain valid.
ALTER TYPE "AttestationStatus" ADD VALUE IF NOT EXISTS 'BUILT';
ALTER TYPE "AttestationStatus" ADD VALUE IF NOT EXISTS 'SIGNED';
ALTER TYPE "AttestationStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "AttestationStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "AttestationStatus" ADD VALUE IF NOT EXISTS 'FINALIZED';
ALTER TYPE "AttestationPublicationState" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "AttestationPublicationState" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "AttestationPublicationState" ADD VALUE IF NOT EXISTS 'FINALIZED';
ALTER TYPE "AttestationPublicationState" ADD VALUE IF NOT EXISTS 'FAILED';

ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "programId" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "eventPda" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "transactionSignature" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "slot" BIGINT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "confirmationStatus" TEXT;

ALTER TABLE "Witness" ADD COLUMN IF NOT EXISTS "programId" TEXT;
ALTER TABLE "Witness" ADD COLUMN IF NOT EXISTS "witnessPda" TEXT;
ALTER TABLE "Witness" ADD COLUMN IF NOT EXISTS "transactionSignature" TEXT;
ALTER TABLE "Witness" ADD COLUMN IF NOT EXISTS "slot" BIGINT;
ALTER TABLE "Witness" ADD COLUMN IF NOT EXISTS "confirmationStatus" TEXT;

ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "programId" TEXT;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "eventPda" TEXT;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "challengePda" TEXT;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "transactionSignature" TEXT;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "slot" BIGINT;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "confirmationStatus" TEXT;

ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "transactionSignature" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "slot" BIGINT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "confirmationStatus" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "eventPda" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "witnessPda" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "attestationPda" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "challengePda" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Event_transactionSignature_key" ON "Event"("transactionSignature");
CREATE UNIQUE INDEX IF NOT EXISTS "Witness_transactionSignature_key" ON "Witness"("transactionSignature");
CREATE UNIQUE INDEX IF NOT EXISTS "Challenge_transactionSignature_key" ON "Challenge"("transactionSignature");
CREATE UNIQUE INDEX IF NOT EXISTS "Attestation_transactionSignature_key" ON "Attestation"("transactionSignature");
CREATE INDEX IF NOT EXISTS "Event_eventPda_idx" ON "Event"("eventPda");
CREATE INDEX IF NOT EXISTS "Witness_witnessPda_idx" ON "Witness"("witnessPda");
CREATE INDEX IF NOT EXISTS "Challenge_challengePda_idx" ON "Challenge"("challengePda");
CREATE INDEX IF NOT EXISTS "Attestation_attestationPda_idx" ON "Attestation"("attestationPda");
