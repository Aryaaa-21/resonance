-- Phase 4: deterministic evidence/observation commitments and witness signature receipts.
DO $$ BEGIN
    CREATE TYPE "IntegrityStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'TAMPERED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Observation" ADD COLUMN IF NOT EXISTS "canonicalizationVersion" TEXT;
ALTER TABLE "Observation" ADD COLUMN IF NOT EXISTS "observationCommitment" TEXT;
ALTER TABLE "Observation" ADD COLUMN IF NOT EXISTS "integrityStatus" "IntegrityStatus" NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "Observation" ADD COLUMN IF NOT EXISTS "integrityVerifiedAt" TIMESTAMP(3);

ALTER TABLE "EvidenceMetadata" ADD COLUMN IF NOT EXISTS "canonicalizationVersion" TEXT;
ALTER TABLE "EvidenceMetadata" ADD COLUMN IF NOT EXISTS "evidenceCommitment" TEXT;
ALTER TABLE "EvidenceMetadata" ADD COLUMN IF NOT EXISTS "integrityStatus" "IntegrityStatus" NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "EvidenceMetadata" ADD COLUMN IF NOT EXISTS "integrityVerifiedAt" TIMESTAMP(3);

ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "canonicalizationVersion" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "observationCommitment" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "evidenceCommitment" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "witnessPublicKey" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "witnessId" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "protocolEventNumber" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "witnessSignature" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "witnessSignatureCommitment" TEXT;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "integrityStatus" "IntegrityStatus" NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "integrityVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "evidenceReferences" JSONB;
ALTER TABLE "Attestation" ADD COLUMN IF NOT EXISTS "observationReference" TEXT;

CREATE INDEX IF NOT EXISTS "Observation_observationCommitment_idx" ON "Observation"("observationCommitment");
CREATE INDEX IF NOT EXISTS "EvidenceMetadata_evidenceCommitment_idx" ON "EvidenceMetadata"("evidenceCommitment");
CREATE INDEX IF NOT EXISTS "Attestation_witnessSignatureCommitment_idx" ON "Attestation"("witnessSignatureCommitment");
CREATE INDEX IF NOT EXISTS "Attestation_integrityStatus_idx" ON "Attestation"("integrityStatus");
