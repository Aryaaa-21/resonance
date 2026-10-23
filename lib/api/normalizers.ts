import type { AIAlert, Challenge, Event, EventLocation, NetworkStats, Witness } from "@/types";

function record(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? value as Record<string, any> : {};
}

function string(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function location(value: unknown): EventLocation {
  const source = record(value);
  return {
    label: string(source.label, "Location unavailable"),
    city: string(source.city, "Unknown city"),
    region: string(source.region, "—"),
    country: string(source.country, "—"),
    coordinates: source.coordinates && typeof source.coordinates === "object" ? {
      latitude: number(source.coordinates.latitude),
      longitude: number(source.coordinates.longitude),
      ...(source.coordinates.accuracyMeters === undefined ? {} : { accuracyMeters: number(source.coordinates.accuracyMeters) }),
    } : undefined,
    ...(source.observationRadiusMeters === undefined ? {} : { observationRadiusMeters: number(source.observationRadiusMeters) }),
  };
}

function categoryFrom(value: unknown, eventType?: unknown): Event["category"] {
  const normalized = string(value).toLowerCase();
  if (["logistics", "location", "identity", "environmental", "security", "other"].includes(normalized)) return normalized as Event["category"];
  return string(eventType).toLowerCase() === "location_arrival" ? "location" : "other";
}

export function normalizeEvent(value: unknown): Event {
  const source = record(value);
  const nested = record(source.event);
  const raw = Object.keys(nested).length > 0 ? nested : source;
  const counts = record(raw.counts);
  return {
    id: string(raw.id),
    title: string(raw.title, "Untitled event"),
    description: string(raw.description),
    category: categoryFrom(raw.category, raw.eventType),
    location: location(raw.location),
    occurredAt: string(raw.occurredAt, new Date(0).toISOString()),
    reportedAt: string(raw.reportedAt, string(raw.createdAt, new Date(0).toISOString())),
    status: string(raw.status, "pending").toLowerCase() as Event["status"],
    state: string(raw.state, "unverified").toLowerCase() as Event["state"],
    confidence: number(raw.confidence),
    witnessIds: arrayOfStrings(raw.witnessIds),
    evidenceIds: arrayOfStrings(raw.evidenceIds),
    challengeIds: arrayOfStrings(raw.challengeIds),
    aiAlertIds: arrayOfStrings(raw.aiAlertIds),
    attestationId: typeof raw.attestationId === "string" ? raw.attestationId : null,
    requestedBy: typeof raw.requestedBy === "string" ? raw.requestedBy : typeof raw.createdById === "string" ? raw.createdById : null,
    simulation: raw.simulation,
    protocol: raw.protocol,
    ...(Object.keys(counts).length === 0 ? {} : { counts }),
  } as Event;
}

export function normalizeWitness(value: unknown): Witness {
  const source = record(value);
  const stake = record(source.stake);
  return {
    id: string(source.id),
    userId: source.userId ?? null,
    name: string(source.name, "Unnamed witness"),
    kind: string(source.kind, "device").toLowerCase() as Witness["kind"],
    description: string(source.description),
    location: location(source.location),
    status: string(source.status, "offline").toLowerCase() as Witness["status"],
    reputationScore: number(source.reputationScore),
    accuracyScore: number(source.accuracyScore),
    observedEventCount: number(source.observedEventCount),
    stake: { amount: number(stake.amount, number(source.stakeAmount)), symbol: string(stake.symbol, string(source.stakeSymbol, "USDC")) },
    lastSeenAt: string(source.lastSeenAt, ""),
    eventIds: arrayOfStrings(source.eventIds),
    simulation: source.simulation,
  } as Witness;
}

export function normalizeChallenge(value: unknown): Challenge {
  const source = record(value);
  const status = string(source.status, "pending").toLowerCase();
  const statusMap: Record<string, Challenge["status"]> = { accepted: "resolved", rejected: "dismissed", inconclusive: "under_review" };
  return {
    id: string(source.id),
    eventId: string(source.eventId),
    raisedBy: string(source.raisedBy ?? source.raisedById ?? source.challengerId),
    reason: string(source.reason, "insufficient_evidence").toLowerCase() as Challenge["reason"],
    description: string(source.description),
    stakeAmount: number(source.stakeAmount),
    stakeSymbol: string(source.stakeSymbol, "USDC"),
    stakeReference: typeof source.stakeReference === "string" ? source.stakeReference : null,
    status: statusMap[status] ?? status as Challenge["status"],
    createdAt: string(source.createdAt, new Date(0).toISOString()),
    reviewDeadline: string(source.reviewDeadline, string(source.createdAt, new Date(0).toISOString())),
    resolvedAt: typeof source.resolvedAt === "string" ? source.resolvedAt : null,
    resolution: typeof source.resolution === "string" ? source.resolution.toLowerCase() as Challenge["resolution"] : null,
    simulation: source.simulation,
  };
}

export function normalizeAlert(value: unknown): AIAlert {
  const source = record(value);
  const confidence = number(source.modelConfidence ?? source.confidence);
  return {
    id: string(source.id),
    eventId: string(source.eventId),
    type: string(source.type, "anomaly").toLowerCase() as AIAlert["type"],
    severity: string(source.severity, "info").toLowerCase() as AIAlert["severity"],
    status: string(source.status, "open").toLowerCase() as AIAlert["status"],
    title: string(source.title, "Advisory signal"),
    message: string(source.message ?? source.description),
    modelName: string(source.modelName, "deterministic-advisory-rules"),
    modelVersion: string(source.modelVersion, "phase-2.0"),
    modelConfidence: confidence <= 1 ? confidence * 100 : confidence,
    detectedAt: string(source.detectedAt, string(source.createdAt, new Date(0).toISOString())),
    evidenceIds: arrayOfStrings(source.evidenceIds),
    recommendedAction: string(source.recommendedAction ?? source.recommendation),
    simulation: source.simulation,
  };
}

export function normalizeNetworkStats(value: unknown): NetworkStats {
  const source = record(value);
  const averageConfidence = number(source.averageConfidence);
  const eventsObserved24h = number(source.eventsObserved24h);
  const verificationsCompleted24h = number(source.verificationsCompleted24h);
  const health = string(source.health, "healthy").toLowerCase();
  return {
    network: "solana-devnet",
    health: health === "degraded" || health === "offline" ? health : "healthy",
    sampledAt: string(source.sampledAt, new Date(0).toISOString()),
    activeWitnesses: number(source.activeWitnesses),
    eventsObserved24h,
    verificationsCompleted24h,
    openChallenges: number(source.openChallenges),
    averageConfidence: averageConfidence <= 1 ? averageConfidence * 100 : averageConfidence,
    simulatedAttestations24h: number(source.simulatedAttestations24h),
    simulation: source.simulation,
  } as NetworkStats;
}
