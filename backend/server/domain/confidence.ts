import type { ConfidenceInput, ConfidenceResult, EventEvidenceSignal } from "./types";

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeSignal(signal: EventEvidenceSignal): number {
  return clamp(signal.confidence > 1 ? signal.confidence / 100 : signal.confidence);
}

function signalQuality(signal: EventEvidenceSignal): number {
  const base = normalizeSignal(signal);
  const status = signal.status?.toLowerCase();
  if (status === "verified" || status === "accepted") return clamp(base + 0.1);
  if (status === "rejected" || status === "expired") return clamp(base - 0.2);
  return base;
}

/**
 * Deterministic, explainable confidence calculation. It is a presentation score,
 * not a cryptographic proof and not an AI decision.
 */
export function calculateConfidence(input: ConfidenceInput): ConfidenceResult {
  const observations = input.observations.map(signalQuality);
  const evidence = input.evidence.map(signalQuality);
  const observationScore = average(observations);
  const evidenceScore = average(evidence);
  const uniqueWitnesses = new Set(
    input.observations.map((signal) => signal.witnessId).filter((id): id is string => Boolean(id)),
  ).size;
  const witnessDiversity = clamp(uniqueWitnesses / 3);
  const score = Math.round(
    clamp(observationScore * 0.55 + evidenceScore * 0.3 + witnessDiversity * 0.15) * 100,
  );
  const rationale = [
    `${input.observations.length} observation signal(s) contributed`,
    `${input.evidence.length} evidence signal(s) contributed`,
    `${uniqueWitnesses} distinct witness source(s) contributed`,
  ];

  return { score, observationScore, evidenceScore, witnessDiversity, rationale };
}
