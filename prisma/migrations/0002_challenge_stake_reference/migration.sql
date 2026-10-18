-- Add an application-level reference for any future stake proof or escrow record.
-- This is metadata only in Phase 2; it does not move funds or publish on-chain state.
ALTER TABLE "Challenge"
ADD COLUMN "stakeReference" TEXT;
