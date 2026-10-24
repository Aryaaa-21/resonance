import { type PrismaClient, Prisma, type UserRole } from "@prisma/client";
import { assertCan } from "../domain/authorization";
import { calculateConfidence } from "../domain/confidence";
import { transitionEventState } from "../domain/state-machine";
import type { Actor } from "../domain/types";
import { advisoryAIService, type AdvisoryAnalysis } from "../services/ai";
import { getProtocolAdapter } from "../services/protocol-adapter";
import { buildEvidenceIntegrity, buildObservationIntegrity, buildEvidenceSetIntegrity, verifyAttestationIntegrity } from "../services/integrity";
import { INTEGRITY_RECEIPT_VERSION, witnessSignatureCommitment } from "@/sdk/evidence";
import { shouldAdvanceCheckpoint } from "../integrations/solana/checkpoint";
import { AppError } from "../errors";
import type { Pagination } from "../pagination";

const categoryToDb = { logistics: "LOGISTICS", location: "LOCATION", identity: "IDENTITY", environmental: "ENVIRONMENTAL", security: "SECURITY", other: "OTHER" } as const;
const eventTypeToDb = { delivery: "DELIVERY", location_arrival: "LOCATION_ARRIVAL" } as const;
const securityLevelToDb = { standard: "STANDARD", elevated: "ELEVATED", high: "HIGH", critical: "CRITICAL" } as const;
const stateToDb = { unverified: "UNVERIFIED", review: "REVIEW", verified: "VERIFIED", challenged: "CHALLENGED", rejected: "REJECTED" } as const;
const lifecycleToDb = { draft: "DRAFT", pending: "PENDING", active: "ACTIVE", processing: "PROCESSING", completed: "COMPLETED", failed: "FAILED", archived: "ARCHIVED" } as const;
const observationKindToDb = { location: "LOCATION", timestamp: "TIMESTAMP", device_signal: "DEVICE_SIGNAL", image: "IMAGE", signature: "SIGNATURE", confirmation: "CONFIRMATION", ai_analysis: "AI_ANALYSIS", sensor: "SENSOR", statement: "STATEMENT", external_signal: "EXTERNAL_SIGNAL", other: "OTHER" } as const;
const evidenceKindToDb = { location: "LOCATION", image: "IMAGE", signature: "SIGNATURE", sensor: "SENSOR", analysis: "ANALYSIS", other: "OTHER" } as const;
const challengeReasonToDb = { insufficient_evidence: "INSUFFICIENT_EVIDENCE", conflicting_observation: "CONFLICTING_OBSERVATION", suspected_fraud: "SUSPECTED_FRAUD", late_submission: "LATE_SUBMISSION", duplicate_claim: "DUPLICATE_CLAIM" } as const;

function lower(value: string): string { return value.toLowerCase(); }
function iso(value: Date | null | undefined): string | null { return value ? value.toISOString() : null; }
function mapUser(user: { id: string; email: string | null; displayName: string; role: UserRole }) { return { id: user.id, email: user.email, displayName: user.displayName, role: lower(user.role) }; }
function slot(value: bigint | number | null | undefined): number | null { return value === null || value === undefined ? null : Number(value); }
function mapProtocolMetadata(value: any, explorerUrl?: string | null) {
  return {
    network: value.network,
    programId: value.programId,
    transactionSignature: value.transactionSignature ?? null,
    slot: slot(value.slot),
    confirmationStatus: value.confirmationStatus ?? null,
    eventPda: value.eventPda ?? null,
    witnessPda: value.witnessPda ?? null,
    attestationPda: value.attestationPda ?? null,
    challengePda: value.challengePda ?? null,
    ...(explorerUrl ? { explorerUrl } : {}),
  };
}

function mapEvent(event: any) {
  const unique = (values: unknown[]) => [...new Set(values.filter((value): value is string => typeof value === "string"))];
  const witnessIds = unique((event.observations ?? []).map((item: any) => item.witnessId));
  const evidenceIds = unique((event.evidence ?? []).map((item: any) => item.id));
  const challengeIds = unique((event.challenges ?? []).map((item: any) => item.id));
  const aiAlertIds = unique((event.aiAlerts ?? []).map((item: any) => item.id));
  const attestationId = event.attestations?.[0]?.id ?? null;
  return {
    id: event.id, title: event.title, description: event.description ?? "", category: lower(event.category), eventType: lower(event.eventType ?? "delivery"), location: event.location,
    occurredAt: event.occurredAt.toISOString(), reportedAt: event.reportedAt.toISOString(), status: lower(event.status), state: lower(event.state), confidence: event.confidence,
    witnessIds, evidenceIds, challengeIds, aiAlertIds, attestationId, requestedBy: event.createdById ?? null,
    projectId: event.projectId, createdById: event.createdById, startedAt: iso(event.startedAt), completedAt: iso(event.completedAt),
    protocol: event.programId || event.eventPda || event.transactionSignature ? mapProtocolMetadata(event) : null,
    counts: event._count ? { observations: event._count.observations, evidence: event._count.evidence, challenges: event._count.challenges, aiAlerts: event._count.aiAlerts } : undefined,
    createdAt: event.createdAt.toISOString(), updatedAt: event.updatedAt.toISOString(),
  };
}
function mapVerificationRequest(request: any) {
  return {
    id: request.id, eventId: request.eventId, projectId: request.projectId, requestedById: request.requestedById, title: request.title, description: request.description ?? "", category: lower(request.category), eventType: lower(request.eventType ?? "delivery"), location: request.location,
    requiredWitnesses: request.requiredWitnesses, deadline: iso(request.deadline), securityLevel: lower(request.securityLevel ?? "standard"), occurredAt: iso(request.occurredAt), reviewNotes: request.reviewNotes, status: lower(request.status), createdAt: request.createdAt.toISOString(), updatedAt: request.updatedAt.toISOString(), cancelledAt: iso(request.cancelledAt),
    event: request.event ? mapEvent(request.event) : undefined, requestedBy: request.requestedBy ? mapUser(request.requestedBy) : undefined,
  };
}
function mapObservation(observation: any) {
  return {
    id: observation.id, eventId: observation.eventId, witnessId: observation.witnessId, submittedById: observation.submittedById, kind: lower(observation.kind), status: lower(observation.status ?? "received"), summary: observation.summary, payload: observation.payload,
    contentHash: observation.contentHash, observationCommitment: observation.observationCommitment ?? null, canonicalizationVersion: observation.canonicalizationVersion ?? null, integrityStatus: lower(observation.integrityStatus ?? "UNVERIFIED"), integrityVerifiedAt: iso(observation.integrityVerifiedAt), confidence: observation.confidence, observedAt: observation.observedAt.toISOString(), receivedAt: observation.receivedAt?.toISOString?.() ?? observation.createdAt.toISOString(), createdAt: observation.createdAt.toISOString(),
    witness: observation.witness ? { id: observation.witness.id, name: observation.witness.name, kind: lower(observation.witness.kind), status: lower(observation.witness.status) } : undefined,
  };
}
function mapEvidence(evidence: any) {
  return {
    id: evidence.id, eventId: evidence.eventId, observationId: evidence.observationId, witnessId: evidence.witnessId, submittedById: evidence.submittedById, kind: lower(evidence.kind), type: lower(evidence.kind), label: evidence.label,
    description: evidence.description ?? "", collectedAt: evidence.collectedAt.toISOString(), contentHash: evidence.contentHash, evidenceCommitment: evidence.evidenceCommitment ?? null, canonicalizationVersion: evidence.canonicalizationVersion ?? null, integrityStatus: lower(evidence.integrityStatus ?? "UNVERIFIED"), integrityVerifiedAt: iso(evidence.integrityVerifiedAt), storageReference: evidence.storageReference ?? evidence.artifactRef ?? null, artifactRef: evidence.artifactRef, metadata: evidence.metadata,
    status: lower(evidence.status), confidence: evidence.confidence, createdAt: evidence.createdAt.toISOString(), updatedAt: evidence.updatedAt.toISOString(),
  };
}
function mapWitness(witness: any) {
  return {
    id: witness.id, userId: witness.userId, projectId: witness.projectId, name: witness.name, kind: lower(witness.kind), description: witness.description ?? "", location: witness.location,
    status: lower(witness.status), reputationScore: witness.reputationScore, accuracyScore: witness.accuracyScore, observedEventCount: witness.observedEventCount,
    stake: { amount: witness.stakeAmount, symbol: witness.stakeSymbol }, stakeReference: witness.stakeReference ?? null,
    protocol: witness.programId || witness.witnessPda || witness.transactionSignature ? mapProtocolMetadata({ network: witness.network ?? "solana-devnet", programId: witness.programId, witnessPda: witness.witnessPda, transactionSignature: witness.transactionSignature, slot: witness.slot, confirmationStatus: witness.confirmationStatus, eventPda: null, attestationPda: null, challengePda: null }) : null,
    eventIds: [...new Set((witness.observations ?? []).map((item: any) => item.eventId).filter((value: unknown): value is string => typeof value === "string"))], lastSeenAt: iso(witness.lastSeenAt), createdAt: witness.createdAt.toISOString(), updatedAt: witness.updatedAt.toISOString(),
  };
}
function mapChallenge(challenge: any) {
  return {
    id: challenge.id, eventId: challenge.eventId, raisedById: challenge.raisedById, challengerId: challenge.raisedById, reason: lower(challenge.reason), description: challenge.description, stakeAmount: challenge.stakeAmount ?? 0, stakeSymbol: challenge.stakeSymbol ?? "USDC", stakeReference: challenge.stakeReference ?? null, status: lower(challenge.status), createdAt: challenge.createdAt.toISOString(),
    reviewDeadline: iso(challenge.reviewDeadline),
    protocol: challenge.programId || challenge.challengePda || challenge.transactionSignature ? mapProtocolMetadata({ network: challenge.network ?? "solana-devnet", programId: challenge.programId, eventPda: challenge.eventPda, challengePda: challenge.challengePda, transactionSignature: challenge.transactionSignature, slot: challenge.slot, confirmationStatus: challenge.confirmationStatus, witnessPda: null, attestationPda: null }) : null,
    resolvedAt: iso(challenge.resolvedAt), resolution: challenge.resolution ? lower(challenge.resolution) : null, raisedBy: challenge.raisedBy ? mapUser(challenge.raisedBy) : undefined,
  };
}
function mapAlert(alert: any) {
  const confidence = alert.confidence ?? alert.modelConfidence ?? 0;
  return {
    id: alert.id, eventId: alert.eventId, type: lower(alert.type), category: lower(alert.category ?? "other"), severity: lower(alert.severity), status: lower(alert.status), title: alert.title, message: alert.message ?? alert.description ?? "", description: alert.description ?? alert.message ?? "", modelName: alert.modelName, modelVersion: alert.modelVersion,
    modelConfidence: confidence <= 1 ? confidence * 100 : confidence, evidenceIds: Array.isArray(alert.evidenceIds) ? alert.evidenceIds : [], recommendedAction: alert.recommendedAction ?? "", detectedAt: alert.detectedAt.toISOString(), resolvedAt: iso(alert.resolvedAt),
  };
}
function mapAttestation(attestation: any) {
  const simulation = attestation.publicationState === "SIMULATION_ONLY";
  return {
    id: attestation.id,
    eventId: attestation.eventId,
    status: lower(attestation.status),
    publicationState: lower(attestation.publicationState),
    network: attestation.network,
    programId: attestation.programId,
    commitment: attestation.commitment,
    observationCommitment: attestation.observationCommitment ?? null,
    evidenceCommitment: attestation.evidenceCommitment ?? attestation.commitment,
    witnessPublicKey: attestation.witnessPublicKey ?? null,
    witnessId: attestation.witnessId ?? null,
    protocolEventNumber: attestation.protocolEventNumber ?? null,
    witnessSignatureCommitment: attestation.witnessSignatureCommitment ?? null,
    integrityStatus: lower(attestation.integrityStatus ?? "UNVERIFIED"),
    integrityVerifiedAt: iso(attestation.integrityVerifiedAt),
    tamperDetected: lower(attestation.integrityStatus ?? "UNVERIFIED") === "tampered",
    simulatedReference: simulation ? attestation.adapterReference ?? "" : "",
    createdAt: attestation.createdAt.toISOString(),
    simulatedAt: iso(attestation.simulatedAt),
    protocol: mapProtocolMetadata(attestation, attestation.explorerUrl ?? null),
    ...(simulation ? { simulation: { isSimulation: true, adapter: "database-backed foundation", publication: "not configured" } } : {}),
  };
}
function eventInclude(withRelations = false) {
  const base = { _count: { select: { observations: true, evidence: true, challenges: true, aiAlerts: true } } } as const;
  if (!withRelations) return base;
  return { ...base, observations: { select: { witnessId: true } }, evidence: { select: { id: true } }, challenges: { select: { id: true } }, aiAlerts: { select: { id: true } }, attestations: { select: { id: true }, orderBy: { createdAt: "desc" as const }, take: 1 } };
}

export class ResonanceOrchestrator {
  constructor(private readonly db: PrismaClient) {}

  async listVerificationRequests(pagination: Pagination, filters: { status?: string; requestedById?: string }) {
    const where: Prisma.VerificationRequestWhereInput = { ...(filters.status ? { status: filters.status.toUpperCase() as never } : {}), ...(filters.requestedById ? { requestedById: filters.requestedById } : {}) };
    const [items, total] = await Promise.all([
      this.db.verificationRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take, include: { event: { include: eventInclude() }, requestedBy: true } }),
      this.db.verificationRequest.count({ where }),
    ]);
    return { items: items.map(mapVerificationRequest), meta: { page: pagination.page, pageSize: pagination.pageSize, total, hasNextPage: pagination.skip + pagination.take < total } };
  }

  async getVerificationRequest(id: string) {
    const request = await this.db.verificationRequest.findUnique({ where: { id }, include: { event: { include: eventInclude() }, requestedBy: true } });
    if (!request) throw AppError.notFound("Verification request not found");
    return mapVerificationRequest(request);
  }

  async createVerificationRequest(input: { title: string; description?: string; category: keyof typeof categoryToDb; eventType?: keyof typeof eventTypeToDb; location: unknown; occurredAt?: Date; projectId?: string; requiredWitnesses?: number; deadline?: Date; securityLevel?: keyof typeof securityLevelToDb }, actor: Actor, requestId: string) {
    assertCan(actor, "create_verification_request");
    const eventType = input.eventType ?? (input.category === "location" ? "location_arrival" : "delivery");
    const occurredAt = input.occurredAt ?? new Date();
    const result = await this.db.$transaction(async (tx) => {
      const event = await tx.event.create({ data: { projectId: input.projectId, createdById: actor.id, eventType: eventTypeToDb[eventType], title: input.title, description: input.description, category: categoryToDb[input.category], location: input.location as Prisma.InputJsonValue, occurredAt, startedAt: occurredAt, status: "PENDING", state: "UNVERIFIED", confidence: 0 }, include: eventInclude() });
      const request = await tx.verificationRequest.create({ data: { eventId: event.id, projectId: input.projectId, requestedById: actor.id, eventType: eventTypeToDb[eventType], title: input.title, description: input.description, category: categoryToDb[input.category], location: input.location as Prisma.InputJsonValue, requiredWitnesses: input.requiredWitnesses ?? 3, deadline: input.deadline, securityLevel: securityLevelToDb[input.securityLevel ?? "standard"], occurredAt }, include: { event: { include: eventInclude() }, requestedBy: true } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "VERIFICATION_REQUEST_CREATED", entityType: "VerificationRequest", entityId: request.id, requestId, metadata: { eventId: event.id } } });
      return request;
    });
    return mapVerificationRequest(result);
  }

  async updateVerificationRequest(id: string, input: { title?: string; description?: string; category?: keyof typeof categoryToDb; eventType?: keyof typeof eventTypeToDb; location?: unknown; occurredAt?: Date; projectId?: string; requiredWitnesses?: number; deadline?: Date; securityLevel?: keyof typeof securityLevelToDb; reviewNotes?: string }, actor: Actor, requestId: string) {
    const existing = await this.db.verificationRequest.findUnique({ where: { id }, include: { event: true } });
    if (!existing) throw AppError.notFound("Verification request not found");
    assertCan(actor, "update_verification_request", { ownerId: existing.requestedById });
    const result = await this.db.$transaction(async (tx) => {
      const updated = await tx.verificationRequest.update({ where: { id }, data: { projectId: input.projectId, title: input.title, description: input.description, category: input.category ? categoryToDb[input.category] : undefined, eventType: input.eventType ? eventTypeToDb[input.eventType] : undefined, location: input.location as Prisma.InputJsonValue | undefined, requiredWitnesses: input.requiredWitnesses, deadline: input.deadline, securityLevel: input.securityLevel ? securityLevelToDb[input.securityLevel] : undefined, occurredAt: input.occurredAt, reviewNotes: input.reviewNotes }, include: { event: { include: eventInclude() }, requestedBy: true } });
      if (existing.eventId) await tx.event.update({ where: { id: existing.eventId }, data: { projectId: input.projectId, eventType: input.eventType ? eventTypeToDb[input.eventType] : undefined, title: input.title, description: input.description, category: input.category ? categoryToDb[input.category] : undefined, location: input.location as Prisma.InputJsonValue | undefined, occurredAt: input.occurredAt } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "UPDATED", entityType: "VerificationRequest", entityId: id, requestId } });
      return updated;
    });
    return mapVerificationRequest(result);
  }

  async cancelVerificationRequest(id: string, actor: Actor, requestId: string) {
    const existing = await this.db.verificationRequest.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Verification request not found");
    assertCan(actor, "cancel_verification_request", { ownerId: existing.requestedById });
    if (["CANCELLED", "VERIFIED", "FAILED", "REJECTED", "COMPLETED"].includes(existing.status)) throw AppError.conflict(`Verification request is already ${lower(existing.status)}`);
    const result = await this.db.$transaction(async (tx) => {
      const updated = await tx.verificationRequest.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() }, include: { event: { include: eventInclude() }, requestedBy: true } });
      if (existing.eventId) await tx.event.update({ where: { id: existing.eventId }, data: { status: "ARCHIVED" } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "CANCELLED", entityType: "VerificationRequest", entityId: id, requestId } });
      return updated;
    });
    return mapVerificationRequest(result);
  }

  async listEvents(pagination: Pagination, filters: { category?: string; status?: string; state?: string }) {
    const where: Prisma.EventWhereInput = { ...(filters.category ? { category: filters.category.toUpperCase() as never } : {}), ...(filters.status ? { status: filters.status.toUpperCase() as never } : {}), ...(filters.state ? { state: filters.state.toUpperCase() as never } : {}) };
    const [items, total] = await Promise.all([
      this.db.event.findMany({ where, orderBy: { reportedAt: "desc" }, skip: pagination.skip, take: pagination.take, include: eventInclude() }),
      this.db.event.count({ where }),
    ]);
    return { items: items.map(mapEvent), meta: { page: pagination.page, pageSize: pagination.pageSize, total, hasNextPage: pagination.skip + pagination.take < total } };
  }

  private async findEvent(id: string, options: { include?: Prisma.EventInclude; select?: Prisma.EventSelect } = {}): Promise<any> {
    const exact = await this.db.event.findUnique({ where: { id }, ...options } as any);
    if (exact || id.startsWith("evt_")) return exact;
    return this.db.event.findUnique({ where: { id: `evt_${id}` }, ...options } as any);
  }

  async getEvent(id: string) {
    const event = await this.findEvent(id, { include: eventInclude(true) });
    if (!event) throw AppError.notFound("Event not found");
    return mapEvent(event);
  }

  private async getEventWithOwner(id: string) {
    const event = await this.findEvent(id, { include: { project: { select: { ownerId: true } } } });
    if (!event) throw AppError.notFound("Event not found");
    return event;
  }

  async updateEvent(id: string, input: { title?: string; description?: string; state?: keyof typeof stateToDb; status?: keyof typeof lifecycleToDb }, actor: Actor, requestId: string) {
    const existing = await this.getEventWithOwner(id);
    assertCan(actor, "manage_event", { ownerId: existing.createdById, projectOwnerId: existing.project?.ownerId });
    const nextState = input.state ? transitionEventState(existing.state.toLowerCase() as never, input.state) : undefined;
    const event = await this.db.$transaction(async (tx) => {
      const updated = await tx.event.update({ where: { id: existing.id }, data: { title: input.title, description: input.description, state: nextState ? stateToDb[nextState] : undefined, status: input.status ? lifecycleToDb[input.status] : undefined }, include: eventInclude() });
      await tx.auditLog.create({ data: { actorId: actor.id, action: input.state ? "STATE_TRANSITIONED" : "UPDATED", entityType: "Event", entityId: existing.id, requestId, metadata: input.state ? { from: lower(existing.state), to: input.state } : undefined } });
      return updated;
    });
    return mapEvent(event);
  }

  async listObservations(eventId: string, pagination: Pagination) {
    await this.getEvent(eventId);
    const where = { eventId };
    const [items, total] = await Promise.all([
      this.db.observation.findMany({ where, orderBy: { observedAt: "desc" }, skip: pagination.skip, take: pagination.take, include: { witness: true } }),
      this.db.observation.count({ where }),
    ]);
    return { items: items.map(mapObservation), meta: { page: pagination.page, pageSize: pagination.pageSize, total, hasNextPage: pagination.skip + pagination.take < total } };
  }

  async createObservation(eventId: string, input: { witnessId: string; kind: keyof typeof observationKindToDb; summary: string; payload?: unknown; contentHash?: string; confidence: number; observedAt?: Date }, actor: Actor, requestId: string) {
    const event = await this.findEvent(eventId, { select: { id: true } });
    if (!event) throw AppError.notFound("Event not found");
    assertCan(actor, "create_observation");
    if (!(await this.db.witness.findUnique({ where: { id: input.witnessId } }))) throw AppError.notFound("Witness not found");
    const observedAt = input.observedAt ?? new Date();
    const integrity = await buildObservationIntegrity({ eventId: event.id, witnessId: input.witnessId, kind: input.kind, summary: input.summary, payload: input.payload ?? null, contentHash: input.contentHash ?? null, observedAt });
    const result = await this.db.$transaction(async (tx) => {
      const observation = await tx.observation.create({ data: { eventId: event.id, witnessId: input.witnessId, submittedById: actor.id, kind: observationKindToDb[input.kind], status: "RECEIVED", summary: input.summary, payload: input.payload as Prisma.InputJsonValue | undefined, contentHash: input.contentHash, canonicalizationVersion: integrity.canonicalizationVersion, observationCommitment: integrity.commitment, integrityStatus: "VERIFIED", integrityVerifiedAt: new Date(), confidence: input.confidence, observedAt, receivedAt: new Date() }, include: { witness: true } });
      await tx.witness.update({ where: { id: input.witnessId }, data: { observedEventCount: { increment: 1 }, lastSeenAt: new Date() } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "OBSERVATION_SUBMITTED", entityType: "Observation", entityId: observation.id, requestId, metadata: { eventId: event.id, observationCommitment: integrity.commitment, canonicalizationVersion: integrity.canonicalizationVersion } } });
      return observation;
    });
    return mapObservation(result);
  }

  async listEvidence(eventId: string, pagination: Pagination) {
    await this.getEvent(eventId);
    const where = { eventId };
    const [items, total] = await Promise.all([
      this.db.evidenceMetadata.findMany({ where, orderBy: { collectedAt: "desc" }, skip: pagination.skip, take: pagination.take }),
      this.db.evidenceMetadata.count({ where }),
    ]);
    return { items: items.map(mapEvidence), meta: { page: pagination.page, pageSize: pagination.pageSize, total, hasNextPage: pagination.skip + pagination.take < total } };
  }

  async createEvidence(eventId: string, input: { witnessId?: string; observationId?: string; kind: keyof typeof evidenceKindToDb; label: string; description?: string; collectedAt?: Date; contentHash: string; artifactRef?: string; metadata?: unknown; confidence: number }, actor: Actor, requestId: string) {
    const event = await this.findEvent(eventId, { select: { id: true } });
    if (!event) throw AppError.notFound("Event not found");
    assertCan(actor, "create_evidence");
    if (input.witnessId && !(await this.db.witness.findUnique({ where: { id: input.witnessId } }))) throw AppError.notFound("Witness not found");
    if (input.observationId && !(await this.db.observation.findFirst({ where: { id: input.observationId, eventId: event.id } }))) throw AppError.notFound("Observation not found for this event");
    const collectedAt = input.collectedAt ?? new Date();
    const integrity = await buildEvidenceIntegrity({ kind: input.kind, label: input.label, description: input.description ?? null, collectedAt, contentHash: input.contentHash, storageReference: input.artifactRef ?? null, metadata: input.metadata ?? null });
    const evidence = await this.db.$transaction(async (tx) => {
      const created = await tx.evidenceMetadata.create({ data: { eventId: event.id, witnessId: input.witnessId, observationId: input.observationId, submittedById: actor.id, kind: evidenceKindToDb[input.kind], label: input.label, description: input.description, collectedAt, contentHash: input.contentHash, canonicalizationVersion: integrity.canonicalizationVersion, evidenceCommitment: integrity.commitment, integrityStatus: "VERIFIED", integrityVerifiedAt: new Date(), storageReference: input.artifactRef, artifactRef: input.artifactRef, metadata: input.metadata as Prisma.InputJsonValue | undefined, confidence: input.confidence } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "EVIDENCE_ATTACHED", entityType: "EvidenceMetadata", entityId: created.id, requestId, metadata: { eventId: event.id, evidenceCommitment: integrity.commitment, canonicalizationVersion: integrity.canonicalizationVersion } } });
      return created;
    });
    return mapEvidence(evidence);
  }

  async eventTimeline(eventId: string, pagination: Pagination) {
    await this.getEvent(eventId);
    const [observations, evidence, challenges, logs] = await Promise.all([
      this.db.observation.findMany({ where: { eventId }, orderBy: { createdAt: "desc" }, take: 100, include: { witness: true } }),
      this.db.evidenceMetadata.findMany({ where: { eventId }, orderBy: { createdAt: "desc" }, take: 100 }),
      this.db.challenge.findMany({ where: { eventId }, orderBy: { createdAt: "desc" }, take: 100, include: { raisedBy: true } }),
      this.db.auditLog.findMany({ where: { entityType: "Event", entityId: eventId }, orderBy: { createdAt: "desc" }, take: 100 }),
    ]);
    const entries = [
      ...observations.map((item) => ({ id: item.id, type: "observation", occurredAt: item.createdAt.toISOString(), data: mapObservation(item) })),
      ...evidence.map((item) => ({ id: item.id, type: "evidence", occurredAt: item.createdAt.toISOString(), data: mapEvidence(item) })),
      ...challenges.map((item) => ({ id: item.id, type: "challenge", occurredAt: item.createdAt.toISOString(), data: mapChallenge(item) })),
      ...logs.map((item) => ({ id: item.id, type: "audit", occurredAt: item.createdAt.toISOString(), data: { action: lower(item.action), entityType: item.entityType, entityId: item.entityId, metadata: item.metadata } })),
    ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const items = entries.slice(pagination.skip, pagination.skip + pagination.take);
    return { items, meta: { page: pagination.page, pageSize: pagination.pageSize, total: entries.length, hasNextPage: pagination.skip + pagination.take < entries.length } };
  }

  async eventNetwork(eventId: string) {
    await this.getEvent(eventId);
    const [observations, evidence, challenges] = await Promise.all([
      this.db.observation.findMany({ where: { eventId }, select: { witnessId: true, confidence: true } }),
      this.db.evidenceMetadata.count({ where: { eventId } }),
      this.db.challenge.count({ where: { eventId } }),
    ]);
    const witnessIds = [...new Set(observations.map((observation) => observation.witnessId))];
    return { eventId, witnessIds, witnessCount: witnessIds.length, observationCount: observations.length, evidenceCount: evidence, challengeCount: challenges, edges: witnessIds.map((witnessId) => ({ witnessId, eventId })) };
  }

  async listWitnesses(pagination: Pagination, filters: { kind?: string; status?: string }) {
    const where: Prisma.WitnessWhereInput = { ...(filters.kind ? { kind: filters.kind.toUpperCase() as never } : {}), ...(filters.status ? { status: filters.status.toUpperCase() as never } : {}) };
    const [items, total] = await Promise.all([
      this.db.witness.findMany({ where, orderBy: { lastSeenAt: "desc" }, skip: pagination.skip, take: pagination.take }),
      this.db.witness.count({ where }),
    ]);
    return { items: items.map(mapWitness), meta: { page: pagination.page, pageSize: pagination.pageSize, total, hasNextPage: pagination.skip + pagination.take < total } };
  }

  async getWitness(id: string) {
    const witness = await this.db.witness.findUnique({ where: { id }, include: { observations: { select: { eventId: true } } } });
    if (!witness) throw AppError.notFound("Witness not found");
    return mapWitness(witness);
  }

  async createWitness(input: { userId?: string; projectId?: string; name: string; kind: string; description?: string; location: unknown; status: string; stakeAmount: number; stakeSymbol: string }, actor: Actor, requestId: string) {
    assertCan(actor, "manage_witness");
    const witness = await this.db.$transaction(async (tx) => {
      const created = await tx.witness.create({ data: { userId: input.userId, projectId: input.projectId, name: input.name, kind: input.kind.toUpperCase() as never, description: input.description, location: input.location as Prisma.InputJsonValue, status: input.status.toUpperCase() as never, stakeAmount: input.stakeAmount, stakeSymbol: input.stakeSymbol } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "CREATED", entityType: "Witness", entityId: created.id, requestId } });
      return created;
    });
    return mapWitness(witness);
  }

  async updateWitness(id: string, input: { userId?: string; projectId?: string; name?: string; kind?: string; description?: string; location?: unknown; status?: string; stakeAmount?: number; stakeSymbol?: string }, actor: Actor, requestId: string) {
    const existing = await this.db.witness.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Witness not found");
    assertCan(actor, "manage_witness", { ownerId: existing.userId });
    const witness = await this.db.$transaction(async (tx) => {
      const updated = await tx.witness.update({ where: { id }, data: { userId: input.userId, projectId: input.projectId, name: input.name, kind: input.kind?.toUpperCase() as never, description: input.description, location: input.location as Prisma.InputJsonValue | undefined, status: input.status?.toUpperCase() as never, stakeAmount: input.stakeAmount, stakeSymbol: input.stakeSymbol } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "UPDATED", entityType: "Witness", entityId: id, requestId } });
      return updated;
    });
    return mapWitness(witness);
  }

  async witnessHistory(id: string, pagination: Pagination) {
    await this.getWitness(id);
    const where = { witnessId: id };
    const [items, total] = await Promise.all([
      this.db.observation.findMany({ where, orderBy: { observedAt: "desc" }, skip: pagination.skip, take: pagination.take, include: { event: { include: eventInclude() }, witness: true } }),
      this.db.observation.count({ where }),
    ]);
    return { items: items.map((item) => ({ ...mapObservation(item), event: mapEvent(item.event) })), meta: { page: pagination.page, pageSize: pagination.pageSize, total, hasNextPage: pagination.skip + pagination.take < total } };
  }

  async listChallenges(pagination: Pagination, filters: { eventId?: string; status?: string }) {
    const where: Prisma.ChallengeWhereInput = { ...(filters.eventId ? { eventId: filters.eventId } : {}), ...(filters.status ? { status: filters.status.toUpperCase() as never } : {}) };
    const [items, total] = await Promise.all([
      this.db.challenge.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take, include: { raisedBy: true } }),
      this.db.challenge.count({ where }),
    ]);
    return { items: items.map(mapChallenge), meta: { page: pagination.page, pageSize: pagination.pageSize, total, hasNextPage: pagination.skip + pagination.take < total } };
  }

  async getChallenge(id: string) {
    const challenge = await this.db.challenge.findUnique({ where: { id }, include: { raisedBy: true } });
    if (!challenge) throw AppError.notFound("Challenge not found");
    return mapChallenge(challenge);
  }

  async createChallenge(eventId: string, input: { reason: keyof typeof challengeReasonToDb; description: string; stakeAmount?: number; stakeSymbol?: string; stakeReference?: string; reviewDeadline?: Date }, actor: Actor, requestId: string) {
    const event = await this.findEvent(eventId, { select: { id: true, state: true } });
    if (!event) throw AppError.notFound("Event not found");
    assertCan(actor, "create_challenge");
    const actualEventId = event.id;
    const nextState = transitionEventState(event.state.toLowerCase() as never, "challenged");
    const challenge = await this.db.$transaction(async (tx) => {
      const created = await tx.challenge.create({ data: { eventId: actualEventId, raisedById: actor.id, reason: challengeReasonToDb[input.reason], description: input.description, stakeAmount: input.stakeAmount ?? 0, stakeSymbol: input.stakeSymbol ?? "USDC", stakeReference: input.stakeReference, status: "PENDING", reviewDeadline: input.reviewDeadline }, include: { raisedBy: true } });
      await tx.event.update({ where: { id: actualEventId }, data: { state: stateToDb[nextState] } });
      await tx.notification.create({ data: { userId: actor.id, eventId: actualEventId, type: "CHALLENGE", title: "Challenge created", body: `Challenge ${created.id} was created for event ${actualEventId}` } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "CHALLENGE_CREATED", entityType: "Challenge", entityId: created.id, requestId, metadata: { eventId: actualEventId } } });
      return created;
    });
    return mapChallenge(challenge);
  }

  async updateChallenge(id: string, input: { status?: string; resolution?: string | null; description?: string }, actor: Actor, requestId: string) {
    const existing = await this.db.challenge.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Challenge not found");
    assertCan(actor, "update_challenge", { raisedById: existing.raisedById });
    const challenge = await this.db.$transaction(async (tx) => {
      const updated = await tx.challenge.update({ where: { id }, data: { status: input.status?.toUpperCase() as never, resolution: input.resolution === undefined ? undefined : input.resolution ? input.resolution.toUpperCase() as never : null, description: input.description, resolvedAt: input.status && ["resolved", "dismissed", "accepted", "rejected", "inconclusive"].includes(input.status) ? new Date() : undefined }, include: { raisedBy: true } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "CHALLENGE_UPDATED", entityType: "Challenge", entityId: id, requestId } });
      return updated;
    });
    return mapChallenge(challenge);
  }

  async listAlerts(pagination: Pagination, filters: { eventId?: string; severity?: string; status?: string }) {
    const where: Prisma.AIAlertWhereInput = { ...(filters.eventId ? { eventId: filters.eventId } : {}), ...(filters.severity ? { severity: filters.severity.toUpperCase() as never } : {}), ...(filters.status ? { status: filters.status.toUpperCase() as never } : {}) };
    const [items, total] = await Promise.all([
      this.db.aIAlert.findMany({ where, orderBy: { detectedAt: "desc" }, skip: pagination.skip, take: pagination.take }),
      this.db.aIAlert.count({ where }),
    ]);
    return { items: items.map(mapAlert), meta: { page: pagination.page, pageSize: pagination.pageSize, total, hasNextPage: pagination.skip + pagination.take < total } };
  }

  private async analysisInput(eventId: string) {
    const event = await this.findEvent(eventId, { include: { observations: true, evidence: true } });
    if (!event) throw AppError.notFound("Event not found");
    const confidence = calculateConfidence({ observations: event.observations.map((item: any) => ({ confidence: item.confidence, witnessId: item.witnessId })), evidence: event.evidence.map((item: any) => ({ confidence: item.confidence, status: item.status })) });
    return { event, eventId: event.id, confidence, observations: event.observations, evidence: event.evidence };
  }

  async getAnalysis(eventId: string) {
    const input = await this.analysisInput(eventId);
    const analysis = await advisoryAIService.analyze({ eventId: input.eventId, title: input.event.title, observations: input.observations.map((item: any) => ({ confidence: item.confidence, witnessId: item.witnessId })), evidence: input.evidence.map((item: any) => ({ confidence: item.confidence })), confidence: input.confidence });
    return { ...analysis, persistedAlertCount: await this.db.aIAlert.count({ where: { eventId: input.eventId } }) };
  }

  async analyzeEvent(eventId: string, actor: Actor, requestId: string): Promise<AdvisoryAnalysis & { persistedAlertIds: readonly string[] }> {
    const eventOwner = await this.getEventWithOwner(eventId);
    assertCan(actor, "run_analysis", { ownerId: eventOwner.createdById, projectOwnerId: eventOwner.project?.ownerId });
    const input = await this.analysisInput(eventId);
    const analysis = await advisoryAIService.analyze({ eventId: input.eventId, title: input.event.title, observations: input.observations.map((item: any) => ({ confidence: item.confidence, witnessId: item.witnessId })), evidence: input.evidence.map((item: any) => ({ confidence: item.confidence })), confidence: input.confidence });
    const persistedAlertIds = await this.db.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const alert of analysis.alerts) {
        const created = await tx.aIAlert.create({ data: { eventId: input.eventId, type: alert.type.toUpperCase() as never, severity: alert.severity.toUpperCase() as never, title: alert.title, message: alert.message, modelName: analysis.modelName, modelVersion: analysis.modelVersion, modelConfidence: analysis.confidence.score / 100, evidenceIds: alert.evidenceIds as Prisma.InputJsonValue, recommendedAction: alert.recommendedAction } });
        ids.push(created.id);
      }
      await tx.event.update({ where: { id: input.eventId }, data: { confidence: analysis.confidence.score } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "ANALYZED", entityType: "Event", entityId: input.eventId, requestId, metadata: { advisoryOnly: true, alertIds: ids } } });
      return ids;
    });
    return { ...analysis, persistedAlertIds };
  }

  async networkStats() {
    const [activeWitnesses, eventsObserved24h, verificationsCompleted24h, openChallenges, simulatedAttestations24h, confidence] = await Promise.all([
      this.db.witness.count({ where: { status: "ACTIVE" } }),
      this.db.event.count({ where: { reportedAt: { gte: new Date(Date.now() - 86_400_000) } } }),
      this.db.event.count({ where: { state: "VERIFIED", updatedAt: { gte: new Date(Date.now() - 86_400_000) } } }),
      this.db.challenge.count({ where: { status: { in: ["PENDING", "OPEN", "UNDER_REVIEW"] } } }),
      this.db.attestation.count({ where: { status: "SIMULATED", createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
      this.db.event.aggregate({ _avg: { confidence: true } }),
    ]);
    return { network: "solana-devnet", health: "healthy", activeWitnesses, eventsObserved24h, verificationsCompleted24h, openChallenges, simulatedAttestations24h, averageConfidence: Math.round((confidence._avg.confidence ?? 0) * 100) / 100, sampledAt: new Date().toISOString(), simulation: { adapter: "database-backed foundation", chainPublication: "not configured" } };
  }

  async networkActivity(pagination: Pagination) {
    const [items, total] = await Promise.all([
      this.db.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take, include: { actor: true } }),
      this.db.auditLog.count(),
    ]);
    return { items: items.map((item) => ({ id: item.id, action: lower(item.action), entityType: item.entityType, entityId: item.entityId, requestId: item.requestId, metadata: item.metadata, createdAt: item.createdAt.toISOString(), actor: item.actor ? mapUser(item.actor) : null })), meta: { page: pagination.page, pageSize: pagination.pageSize, total, hasNextPage: pagination.skip + pagination.take < total } };
  }

  async networkHealth() {
    const [users, projects, events, witnesses, observations, evidence] = await Promise.all([this.db.user.count(), this.db.project.count(), this.db.event.count(), this.db.witness.count(), this.db.observation.count(), this.db.evidenceMetadata.count()]);
    return { status: "healthy", database: "connected", counts: { users, projects, events, witnesses, observations, evidence }, checkedAt: new Date().toISOString(), claims: { realChain: false, consensus: false, staking: false, cryptographicAttestation: false, aiAuthority: false } };
  }

  async listAttestations(pagination: Pagination, filters: { eventId?: string; status?: string }) {
    const where: Prisma.AttestationWhereInput = { ...(filters.eventId ? { eventId: filters.eventId } : {}), ...(filters.status ? { status: filters.status.toUpperCase() as never } : {}) };
    const [items, total] = await Promise.all([
      this.db.attestation.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
      this.db.attestation.count({ where }),
    ]);
    return { items: items.map(mapAttestation), meta: { page: pagination.page, pageSize: pagination.pageSize, total, hasNextPage: pagination.skip + pagination.take < total } };
  }

  async prepareProtocolAttestation(eventId: string, input: { integrityMode: "legacy" | "phase4"; eventNumber: bigint | number | string; witnessOwner: string; witnessId: string; claim: boolean; result?: "supports" | "refutes" | "inconclusive"; observationId?: string; evidenceIds?: readonly string[]; observationCommitment?: string; observationTimestamp?: bigint | number | string; evidenceCommitment?: string; witnessSignature?: string; walletAddress: string }, actor: Actor, requestId: string) {
    const event = await this.getEventWithOwner(eventId);
    assertCan(actor, "manage_event", { ownerId: event.createdById, projectOwnerId: event.project?.ownerId });
    const actualEventId = event.id;
    let observationCommitment = input.observationCommitment;
    let evidenceCommitment = input.evidenceCommitment;
    let witnessSignatureCommitmentValue: string | undefined;
    let integrityStatus: "VERIFIED" | "UNVERIFIED" = "UNVERIFIED";
    let canonicalizationVersion: string | undefined;
    let observationReference: string | undefined;
    let evidenceReferences: Prisma.InputJsonValue | undefined;

    if (input.integrityMode === "phase4") {
      if (!input.observationId || !input.evidenceIds?.length || !input.witnessSignature) throw AppError.badRequest("Phase 4 requires an observation, evidence references, and a witness signature");
      const observation = await this.db.observation.findFirst({ where: { id: input.observationId, eventId: actualEventId } });
      if (!observation) throw AppError.notFound("Observation not found for this event");
      if (observation.witnessId !== input.witnessId) throw AppError.conflict("The observation witness does not match the attestation witness");
      const evidence = await this.db.evidenceMetadata.findMany({ where: { id: { in: [...input.evidenceIds] }, eventId: actualEventId }, orderBy: { id: "asc" } });
      if (evidence.length !== input.evidenceIds.length) throw AppError.notFound("One or more evidence records were not found for this event");
      const observationIntegrity = await buildObservationIntegrity(observation);
      const evidenceIntegrity = await buildEvidenceSetIntegrity(evidence);
      if (observation.observationCommitment && observation.observationCommitment.replace(/^sha256:/i, "").toLowerCase() !== observationIntegrity.commitment) throw AppError.conflict("Observation metadata no longer matches its stored commitment");
      if (evidence.some((record, index) => record.evidenceCommitment && record.evidenceCommitment.replace(/^sha256:/i, "").toLowerCase() !== evidenceIntegrity.leaves[index].commitment)) throw AppError.conflict("Evidence metadata no longer matches its stored commitment");
      observationCommitment = observationIntegrity.commitment;
      evidenceCommitment = evidenceIntegrity.commitment;
      const signatureCommitment = await witnessSignatureCommitment(input.witnessSignature);
      const { witnessSignatureMessage, verifyWitnessSignature } = await import("@/sdk/evidence");
      const message = witnessSignatureMessage({ eventNumber: input.eventNumber, witnessOwner: input.witnessOwner, witnessId: input.witnessId, observationCommitment, evidenceCommitment });
      if (!(await verifyWitnessSignature({ witnessOwner: input.witnessOwner, message, signature: input.witnessSignature }))) throw AppError.conflict("Witness signature verification failed");
      witnessSignatureCommitmentValue = signatureCommitment;
      integrityStatus = "VERIFIED";
      canonicalizationVersion = INTEGRITY_RECEIPT_VERSION;
      observationReference = observation.id;
      evidenceReferences = input.evidenceIds as unknown as Prisma.InputJsonValue;
    }

    if (!observationCommitment || !evidenceCommitment) throw AppError.badRequest("An observation commitment and evidence commitment are required");
    const prepared = await getProtocolAdapter("solana").prepareAttestation({ eventId: actualEventId, eventNumber: input.eventNumber, witnessOwner: input.witnessOwner, witnessId: input.witnessId, claim: input.claim, result: input.result, observationCommitment, observationTimestamp: input.observationTimestamp, evidenceCommitment, witnessSignatureCommitment: witnessSignatureCommitmentValue, walletAddress: input.walletAddress });
    const attestation = await this.db.attestation.create({ data: { eventId: actualEventId, createdById: actor.id, status: "BUILT", publicationState: "NOT_SUBMITTED", network: prepared.network, programId: prepared.programId, commitment: prepared.commitment, observationCommitment, evidenceCommitment, canonicalizationVersion, witnessPublicKey: input.witnessOwner, witnessId: input.witnessId, protocolEventNumber: String(input.eventNumber), witnessSignature: input.witnessSignature, witnessSignatureCommitment: witnessSignatureCommitmentValue, integrityStatus, integrityVerifiedAt: integrityStatus === "VERIFIED" ? new Date() : undefined, evidenceReferences, observationReference, eventPda: prepared.eventPda, witnessPda: prepared.witnessPda, attestationPda: prepared.attestationPda, expectedSubmitter: prepared.expectedSubmitter, expectedInstructionData: prepared.expectedInstructionData, expectedInstructionAccounts: prepared.expectedInstructionAccounts as Prisma.InputJsonValue } });
    await this.db.auditLog.create({ data: { actorId: actor.id, action: "CREATED", entityType: "Attestation", entityId: attestation.id, requestId, metadata: { lifecycle: "built", chainPublication: true, integrityMode: input.integrityMode, integrityStatus } } });
    return { ...mapAttestation(attestation), lifecycle: prepared.lifecycle, serializedTransaction: prepared.serializedTransaction, explorerUrl: prepared.explorerUrl };
  }

  async syncProtocolAttestation(input: { attestationId: string; transactionSignature: string }, actor: Actor, requestId: string) {
    const existing = await this.db.attestation.findUnique({ where: { id: input.attestationId } });
    if (!existing) throw AppError.notFound("Attestation not found");
    if (existing.transactionSignature && existing.transactionSignature !== input.transactionSignature) {
      throw AppError.conflict("This attestation is already bound to a different transaction signature");
    }
    const event = await this.getEventWithOwner(existing.eventId);
    assertCan(actor, "manage_event", { ownerId: event.createdById, projectOwnerId: event.project?.ownerId });
    const instructionAccounts = Array.isArray(existing.expectedInstructionAccounts)
      ? existing.expectedInstructionAccounts.filter((value): value is string => typeof value === "string")
      : [];
    if (!existing.expectedInstructionData || !existing.expectedSubmitter || instructionAccounts.length === 0 || !existing.eventPda || !existing.witnessPda || !existing.attestationPda) {
      throw AppError.conflict("Attestation is missing the prepared transaction envelope required for secure sync");
    }
    const synced = await getProtocolAdapter("solana").syncAttestation({
      ...input,
      expected: {
        programId: existing.programId,
        eventPda: existing.eventPda,
        witnessPda: existing.witnessPda,
        attestationPda: existing.attestationPda,
        instructionData: existing.expectedInstructionData,
        instructionAccounts,
        submitter: existing.expectedSubmitter,
      },
    });
    const lifecycle = !synced.verified && (synced.lifecycle === "confirmed" || synced.lifecycle === "finalized") ? "submitted" : synced.lifecycle;
    const incomingStatus = lifecycle === "finalized" ? "FINALIZED" : lifecycle === "confirmed" ? "CONFIRMED" : lifecycle === "failed" ? "FAILED" : lifecycle === "submitted" ? "SUBMITTED" : "BUILT";
    const incomingPublicationState = lifecycle === "finalized" ? "FINALIZED" : lifecycle === "confirmed" ? "CONFIRMED" : lifecycle === "failed" ? "FAILED" : "SUBMITTED";
    const rank = (value: string) => ({ BUILT: 1, SUBMITTED: 2, CONFIRMED: 3, FINALIZED: 4, FAILED: 0 }[value] ?? 0);
    const status = existing.status === "FINALIZED" && incomingStatus !== "FINALIZED" ? "FINALIZED" : incomingStatus === "FAILED" ? "FAILED" : rank(incomingStatus) >= rank(existing.status) ? incomingStatus : existing.status;
    const publicationState = status === "FINALIZED" ? "FINALIZED" : status === "CONFIRMED" ? "CONFIRMED" : status === "FAILED" ? "FAILED" : status === "BUILT" ? "NOT_SUBMITTED" : incomingPublicationState;
    const attestation = await this.db.$transaction(async (tx) => {
      const updated = await tx.attestation.update({ where: { id: existing.id }, data: { status: status as never, publicationState: publicationState as never, transactionSignature: synced.transactionSignature, slot: synced.slot === null ? undefined : BigInt(synced.slot), confirmationStatus: synced.confirmationStatus, programId: synced.programId, network: synced.network } });
      if (synced.verified && synced.slot !== null) {
        const checkpointKey = { network: synced.network, programId: synced.programId };
        const current = await tx.chainSyncCheckpoint.findUnique({ where: { network_programId: checkpointKey } });
        const candidateSlot = BigInt(synced.slot);
        if (shouldAdvanceCheckpoint(current ? { lastSlot: current.lastSlot, lastSignature: current.lastSignature } : null, { lastSlot: candidateSlot, lastSignature: synced.transactionSignature })) {
          await tx.chainSyncCheckpoint.upsert({ where: { network_programId: checkpointKey }, create: { ...checkpointKey, lastSlot: candidateSlot, lastSignature: synced.transactionSignature }, update: { lastSlot: candidateSlot, lastSignature: synced.transactionSignature } });
        }
      }
      await tx.auditLog.create({ data: { actorId: actor.id, action: "UPDATED", entityType: "Attestation", entityId: existing.id, requestId, metadata: { lifecycle, verified: synced.verified, error: synced.error } } });
      return updated;
    });
    return { ...mapAttestation(attestation), lifecycle, verified: synced.verified, error: synced.error, explorerUrl: synced.explorerUrl };
  }

  async verifyProtocolAttestation(attestationId: string, requestId = "independent-verification") {
    const existing = await this.db.attestation.findUnique({ where: { id: attestationId } });
    if (!existing) throw AppError.notFound("Attestation not found");
    const reasons: string[] = [];
    let integrity: Awaited<ReturnType<typeof verifyAttestationIntegrity>> | null = null;
    if (!existing.witnessPublicKey || !existing.witnessId || !existing.protocolEventNumber || !existing.witnessSignature || !existing.witnessSignatureCommitment || !existing.observationReference || !existing.evidenceReferences || !existing.observationCommitment || !existing.evidenceCommitment) {
      reasons.push("attestation does not contain the complete Phase 4 integrity receipt");
    } else {
      const observation = await this.db.observation.findUnique({ where: { id: existing.observationReference } });
      const evidenceIds = Array.isArray(existing.evidenceReferences) ? existing.evidenceReferences.filter((value): value is string => typeof value === "string") : [];
      const evidence = evidenceIds.length ? await this.db.evidenceMetadata.findMany({ where: { id: { in: evidenceIds }, eventId: existing.eventId }, orderBy: { id: "asc" } }) : [];
      if (!observation || observation.eventId !== existing.eventId) reasons.push("committed observation is missing or belongs to another event");
      if (evidence.length !== evidenceIds.length) reasons.push("one or more committed evidence records are missing");
      if (observation && evidence.length === evidenceIds.length) {
        integrity = await verifyAttestationIntegrity({ protocolEventNumber: existing.protocolEventNumber, witnessOwner: existing.witnessPublicKey, witnessId: existing.witnessId, observation, evidence, expectedObservationCommitment: existing.observationCommitment, expectedEvidenceCommitment: existing.evidenceCommitment, witnessSignature: existing.witnessSignature, expectedWitnessSignatureCommitment: existing.witnessSignatureCommitment });
        reasons.push(...integrity.reasons);
      }
    }

    let chainVerification: { verified: boolean; lifecycle: string; error: string | null } | null = null;
    if (existing.transactionSignature && existing.expectedInstructionData && existing.expectedSubmitter && existing.eventPda && existing.witnessPda && existing.attestationPda && Array.isArray(existing.expectedInstructionAccounts)) {
      const synced = await getProtocolAdapter("solana").syncAttestation({ attestationId: existing.id, transactionSignature: existing.transactionSignature, expected: { programId: existing.programId, eventPda: existing.eventPda, witnessPda: existing.witnessPda, attestationPda: existing.attestationPda, instructionData: existing.expectedInstructionData, instructionAccounts: existing.expectedInstructionAccounts.filter((value): value is string => typeof value === "string"), submitter: existing.expectedSubmitter } });
      chainVerification = { verified: synced.verified, lifecycle: synced.lifecycle, error: synced.error };
      if (!synced.verified) reasons.push(synced.error ?? "Solana transaction could not be independently verified");
    } else {
      reasons.push("attestation has not been bound to a verifiable Solana transaction");
    }

    const tampered = Boolean(integrity?.tampered) || reasons.some((reason) => /metadata was modified|does not match|committed .* missing|signature is invalid/.test(reason));
    const integrityVerified = Boolean(integrity?.verified);
    const anchored = chainVerification?.verified === true;
    const status = tampered ? "TAMPERED" : integrityVerified ? "VERIFIED" : "UNVERIFIED";
    const updated = await this.db.$transaction(async (tx) => {
      const result = await tx.attestation.update({ where: { id: existing.id }, data: { integrityStatus: status, integrityVerifiedAt: new Date() } });
      if (tampered && existing.observationReference) await tx.observation.updateMany({ where: { id: existing.observationReference }, data: { integrityStatus: "TAMPERED", integrityVerifiedAt: new Date() } });
      if (tampered && Array.isArray(existing.evidenceReferences)) {
        const ids = existing.evidenceReferences.filter((value): value is string => typeof value === "string");
        if (ids.length) await tx.evidenceMetadata.updateMany({ where: { id: { in: ids } }, data: { integrityStatus: "TAMPERED", integrityVerifiedAt: new Date() } });
      }
      await tx.auditLog.create({ data: { actorId: null, action: "UPDATED", entityType: "Attestation", entityId: existing.id, requestId, metadata: { independentVerification: true, integrityVerified, anchored, tampered, reasons } } });
      return result;
    });
    return { attestation: mapAttestation(updated), integrityVerified, anchored, tampered, evidenceVerified: integrity?.evidenceVerified ?? false, observationVerified: integrity?.observationVerified ?? false, signatureVerified: integrity?.signatureVerified ?? false, chainVerification, reasons };
  }

  async publishDemoAttestation(eventId: string, actor: Actor, requestId: string) {
    const event = await this.getEventWithOwner(eventId);
    assertCan(actor, "manage_event", { ownerId: event.createdById, projectOwnerId: event.project?.ownerId });
    const actualEventId = event.id;
    const commitment = `event:${actualEventId}:confidence:${event.confidence}`;
    const result = await getProtocolAdapter("demo").publishAttestation({ eventId: actualEventId, eventNumber: 0, witnessOwner: "11111111111111111111111111111111", witnessId: "11".repeat(32), claim: true, evidenceCommitment: commitment, network: "demo", programId: "not-configured" });
    const attestation = await this.db.attestation.create({ data: { eventId: actualEventId, createdById: actor.id, status: "SIMULATED", publicationState: "SIMULATION_ONLY", network: "demo", programId: "not-configured", commitment, adapterReference: result.adapterReference, simulatedAt: new Date() } });
    await this.db.auditLog.create({ data: { actorId: actor.id, action: "CREATED", entityType: "Attestation", entityId: attestation.id, requestId, metadata: { isSimulation: true } } });
    return { ...mapAttestation(attestation), adapterReference: attestation.adapterReference, isSimulation: true, notice: result.notice };
  }
}

export function createOrchestrator(db: PrismaClient): ResonanceOrchestrator { return new ResonanceOrchestrator(db); }
