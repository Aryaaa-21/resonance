export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracyMeters?: number;
}

export interface Location {
  readonly label: string;
  readonly city: string;
  readonly region: string;
  readonly country: string;
  readonly coordinates?: Coordinates;
}

export type DomainUserRole = "user" | "reviewer" | "admin" | "witness" | "service";
export type DomainProjectStatus = "active" | "archived";
export type DomainEventCategory = "logistics" | "location" | "identity" | "environmental" | "security" | "other";
export type DomainEventLifecycleStatus = "draft" | "pending" | "active" | "processing" | "completed" | "failed" | "archived";
export type DomainEventState = "unverified" | "review" | "verified" | "challenged" | "rejected";
export type DomainVerificationRequestStatus = "pending" | "approved" | "cancelled" | "rejected" | "completed";
export interface UserModel { readonly id: string; readonly email: string; readonly displayName: string; readonly role: DomainUserRole; readonly createdAt: string; readonly updatedAt: string; }
export interface ProjectModel { readonly id: string; readonly name: string; readonly description: string | null; readonly status: DomainProjectStatus; readonly ownerId: string; readonly createdAt: string; readonly updatedAt: string; }
export interface VerificationRequestModel { readonly id: string; readonly eventId: string | null; readonly requestedById: string; readonly status: DomainVerificationRequestStatus; readonly title: string; readonly description: string; readonly category: DomainEventCategory; readonly location: Location; readonly occurredAt: string | null; readonly reviewNotes: string | null; readonly createdAt: string; readonly updatedAt: string; readonly cancelledAt: string | null; }
export interface EventModel { readonly id: string; readonly projectId: string | null; readonly createdById: string | null; readonly title: string; readonly description: string; readonly category: DomainEventCategory; readonly location: Location; readonly occurredAt: string; readonly reportedAt: string; readonly status: DomainEventLifecycleStatus; readonly state: DomainEventState; readonly confidence: number; readonly createdAt: string; readonly updatedAt: string; }
export interface WitnessModel { readonly id: string; readonly userId: string | null; readonly projectId: string | null; readonly name: string; readonly kind: string; readonly description: string; readonly location: Location; readonly status: string; readonly reputationScore: number; readonly accuracyScore: number; readonly observedEventCount: number; readonly stake: { readonly amount: number; readonly symbol: string }; readonly lastSeenAt: string | null; readonly createdAt: string; readonly updatedAt: string; }
export interface ObservationModel { readonly id: string; readonly eventId: string; readonly witnessId: string; readonly submittedById: string | null; readonly kind: string; readonly summary: string; readonly payload: unknown; readonly contentHash: string | null; readonly confidence: number; readonly observedAt: string; readonly createdAt: string; }
export interface EvidenceMetadataModel { readonly id: string; readonly eventId: string; readonly observationId: string | null; readonly witnessId: string | null; readonly submittedById: string | null; readonly kind: string; readonly label: string; readonly description: string; readonly collectedAt: string; readonly contentHash: string; readonly artifactRef: string | null; readonly metadata: unknown; readonly status: string; readonly confidence: number; readonly createdAt: string; readonly updatedAt: string; }
export interface AIAlertModel { readonly id: string; readonly eventId: string; readonly type: string; readonly severity: string; readonly status: string; readonly title: string; readonly message: string; readonly modelName: string; readonly modelVersion: string; readonly modelConfidence: number; readonly evidenceIds: readonly string[]; readonly recommendedAction: string; readonly detectedAt: string; readonly resolvedAt: string | null; }
export interface ChallengeModel { readonly id: string; readonly eventId: string; readonly raisedById: string; readonly reason: string; readonly description: string; readonly status: string; readonly createdAt: string; readonly reviewDeadline: string | null; readonly resolvedAt: string | null; readonly resolution: string | null; }
export interface AuditLogModel { readonly id: string; readonly actorId: string | null; readonly action: string; readonly entityType: string; readonly entityId: string; readonly requestId: string | null; readonly metadata: unknown; readonly createdAt: string; }
export interface NotificationModel { readonly id: string; readonly userId: string; readonly eventId: string | null; readonly type: string; readonly status: string; readonly title: string; readonly body: string; readonly metadata: unknown; readonly createdAt: string; readonly readAt: string | null; }
export interface AttestationModel { readonly id: string; readonly eventId: string; readonly createdById: string | null; readonly status: string; readonly publicationState: string; readonly network: string; readonly programId: string; readonly commitment: string; /** Local adapter reference only; never a transaction signature. */ readonly adapterReference: string | null; readonly createdAt: string; readonly simulatedAt: string | null; }
