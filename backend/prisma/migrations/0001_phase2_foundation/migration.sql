-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('REQUESTER', 'WITNESS', 'STAKER', 'DEVELOPER', 'ADMIN', 'REVIEWER', 'SERVICE', 'USER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('LOGISTICS', 'LOCATION', 'IDENTITY', 'ENVIRONMENTAL', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('DELIVERY', 'LOCATION_ARRIVAL');

-- CreateEnum
CREATE TYPE "SecurityLevel" AS ENUM ('STANDARD', 'ELEVATED', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EventLifecycleStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventState" AS ENUM ('UNVERIFIED', 'REVIEW', 'VERIFIED', 'CHALLENGED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationRequestStatus" AS ENUM ('DRAFT', 'PENDING', 'VERIFYING', 'VERIFIED', 'FAILED', 'CHALLENGED', 'CANCELLED', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WitnessKind" AS ENUM ('DEVICE', 'HUMAN', 'SERVICE', 'IOT', 'AI_AGENT', 'EXTERNAL_SYSTEM');

-- CreateEnum
CREATE TYPE "WitnessStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'REVIEW', 'OFFLINE');

-- CreateEnum
CREATE TYPE "ObservationKind" AS ENUM ('LOCATION', 'TIMESTAMP', 'DEVICE_SIGNAL', 'IMAGE', 'SIGNATURE', 'CONFIRMATION', 'AI_ANALYSIS', 'SENSOR', 'STATEMENT', 'EXTERNAL_SIGNAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ObservationStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'ACCEPTED', 'REJECTED', 'REVIEW');

-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('IMAGE', 'LOCATION', 'DEVICE_DATA', 'SIGNATURE', 'DOCUMENT', 'VIDEO', 'AI_REPORT', 'SENSOR', 'ANALYSIS', 'OTHER');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('RECEIVED', 'ANALYZING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AIAlertType" AS ENUM ('ANOMALY', 'CONFLICTING_SIGNAL', 'LOW_CONFIDENCE', 'DUPLICATE_SIGNAL', 'SPOOFING_RISK');

-- CreateEnum
CREATE TYPE "AIAlertCategory" AS ENUM ('TIMING_ANOMALY', 'LOCATION_ANOMALY', 'WITNESS_ANOMALY', 'EVIDENCE_ANOMALY', 'CONSENSUS_ANOMALY', 'OTHER');

-- CreateEnum
CREATE TYPE "AIAlertSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AIAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ChallengeReason" AS ENUM ('INSUFFICIENT_EVIDENCE', 'CONFLICTING_OBSERVATION', 'SUSPECTED_FRAUD', 'LATE_SUBMISSION', 'DUPLICATE_CLAIM');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'INCONCLUSIVE', 'OPEN', 'RESOLVED', 'DISMISSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ChallengeResolution" AS ENUM ('UPHELD', 'DISMISSED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EVENT_UPDATE', 'CHALLENGE', 'ALERT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttestationStatus" AS ENUM ('QUEUED', 'SIMULATED', 'FAILED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AttestationPublicationState" AS ENUM ('NOT_SUBMITTED', 'SIMULATION_ONLY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'CANCELLED', 'STATE_TRANSITIONED', 'ANALYZED', 'CHALLENGE_RAISED', 'CHALLENGE_UPDATED', 'SESSION_CREATED', 'SESSION_REVOKED', 'VERIFICATION_REQUEST_CREATED', 'EVENT_UPDATED', 'WITNESS_REGISTERED', 'OBSERVATION_SUBMITTED', 'EVIDENCE_ATTACHED', 'CHALLENGE_CREATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT,
    "email" TEXT,
    "displayName" TEXT NOT NULL DEFAULT 'Anonymous operator',
    "role" "UserRole" NOT NULL DEFAULT 'REQUESTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId","userId")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "projectId" TEXT,
    "requestedById" TEXT NOT NULL,
    "status" "VerificationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "eventType" "EventType" NOT NULL DEFAULT 'DELIVERY',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "EventCategory" NOT NULL,
    "location" JSONB NOT NULL,
    "requiredWitnesses" INTEGER NOT NULL DEFAULT 3,
    "deadline" TIMESTAMP(3),
    "securityLevel" "SecurityLevel" NOT NULL DEFAULT 'STANDARD',
    "occurredAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "createdById" TEXT,
    "eventType" "EventType" NOT NULL DEFAULT 'DELIVERY',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "EventCategory" NOT NULL,
    "location" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EventLifecycleStatus" NOT NULL DEFAULT 'PENDING',
    "state" "EventState" NOT NULL DEFAULT 'UNVERIFIED',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Witness" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "kind" "WitnessKind" NOT NULL,
    "description" TEXT,
    "location" JSONB NOT NULL,
    "status" "WitnessStatus" NOT NULL DEFAULT 'OFFLINE',
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observedEventCount" INTEGER NOT NULL DEFAULT 0,
    "stakeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stakeSymbol" TEXT NOT NULL DEFAULT 'USDC',
    "stakeReference" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Witness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "witnessId" TEXT NOT NULL,
    "submittedById" TEXT,
    "kind" "ObservationKind" NOT NULL,
    "status" "ObservationStatus" NOT NULL DEFAULT 'RECEIVED',
    "summary" TEXT NOT NULL,
    "payload" JSONB,
    "contentHash" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceMetadata" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "observationId" TEXT,
    "witnessId" TEXT,
    "submittedById" TEXT,
    "kind" "EvidenceKind" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "contentHash" TEXT NOT NULL,
    "storageReference" TEXT,
    "artifactRef" TEXT,
    "metadata" JSONB,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'RECEIVED',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAlert" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "AIAlertType" NOT NULL,
    "category" "AIAlertCategory" NOT NULL DEFAULT 'OTHER',
    "severity" "AIAlertSeverity" NOT NULL,
    "status" "AIAlertStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "message" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "modelConfidence" DOUBLE PRECISION NOT NULL,
    "evidenceIds" JSONB,
    "recommendedAction" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "reason" "ChallengeReason" NOT NULL,
    "description" TEXT NOT NULL,
    "stakeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stakeSymbol" TEXT NOT NULL DEFAULT 'USDC',
    "status" "ChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewDeadline" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" "ChallengeResolution",

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "requestId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attestation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdById" TEXT,
    "status" "AttestationStatus" NOT NULL DEFAULT 'QUEUED',
    "publicationState" "AttestationPublicationState" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "network" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "adapterReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "simulatedAt" TIMESTAMP(3),

    CONSTRAINT "Attestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "responseCode" INTEGER,
    "responseBody" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRequest_eventId_key" ON "VerificationRequest"("eventId");

-- CreateIndex
CREATE INDEX "VerificationRequest_projectId_status_idx" ON "VerificationRequest"("projectId", "status");

-- CreateIndex
CREATE INDEX "VerificationRequest_requestedById_status_idx" ON "VerificationRequest"("requestedById", "status");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_createdAt_idx" ON "VerificationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Event_projectId_idx" ON "Event"("projectId");

-- CreateIndex
CREATE INDEX "Event_state_status_idx" ON "Event"("state", "status");

-- CreateIndex
CREATE INDEX "Event_reportedAt_idx" ON "Event"("reportedAt");

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Witness_userId_key" ON "Witness"("userId");

-- CreateIndex
CREATE INDEX "Witness_projectId_idx" ON "Witness"("projectId");

-- CreateIndex
CREATE INDEX "Witness_status_kind_idx" ON "Witness"("status", "kind");

-- CreateIndex
CREATE INDEX "Observation_eventId_observedAt_idx" ON "Observation"("eventId", "observedAt");

-- CreateIndex
CREATE INDEX "Observation_witnessId_createdAt_idx" ON "Observation"("witnessId", "createdAt");

-- CreateIndex
CREATE INDEX "EvidenceMetadata_eventId_status_idx" ON "EvidenceMetadata"("eventId", "status");

-- CreateIndex
CREATE INDEX "EvidenceMetadata_contentHash_idx" ON "EvidenceMetadata"("contentHash");

-- CreateIndex
CREATE INDEX "AIAlert_eventId_status_idx" ON "AIAlert"("eventId", "status");

-- CreateIndex
CREATE INDEX "AIAlert_severity_detectedAt_idx" ON "AIAlert"("severity", "detectedAt");

-- CreateIndex
CREATE INDEX "Challenge_eventId_status_idx" ON "Challenge"("eventId", "status");

-- CreateIndex
CREATE INDEX "Challenge_raisedById_createdAt_idx" ON "Challenge"("raisedById", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_status_createdAt_idx" ON "Notification"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Attestation_eventId_status_idx" ON "Attestation"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_scope_key_key" ON "IdempotencyKey"("scope", "key");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Witness" ADD CONSTRAINT "Witness_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_witnessId_fkey" FOREIGN KEY ("witnessId") REFERENCES "Witness"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceMetadata" ADD CONSTRAINT "EvidenceMetadata_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceMetadata" ADD CONSTRAINT "EvidenceMetadata_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceMetadata" ADD CONSTRAINT "EvidenceMetadata_witnessId_fkey" FOREIGN KEY ("witnessId") REFERENCES "Witness"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceMetadata" ADD CONSTRAINT "EvidenceMetadata_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAlert" ADD CONSTRAINT "AIAlert_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

