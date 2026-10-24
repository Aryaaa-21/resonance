import type { ConfidenceResult, EventEvidenceSignal } from "../domain/types";

export type AdvisoryAlertType = "low_confidence" | "conflicting_signal" | "duplicate_signal";
export type AdvisorySeverity = "info" | "low" | "medium" | "high";

export interface AdvisoryAnalysisInput {
  readonly eventId: string;
  readonly title: string;
  readonly observations: readonly EventEvidenceSignal[];
  readonly evidence: readonly EventEvidenceSignal[];
  readonly confidence: ConfidenceResult;
}

export interface AdvisoryAlert {
  readonly type: AdvisoryAlertType;
  readonly severity: AdvisorySeverity;
  readonly title: string;
  readonly message: string;
  readonly recommendedAction: string;
  readonly evidenceIds: readonly string[];
}

export interface AdvisoryAnalysis {
  readonly eventId: string;
  readonly advisoryOnly: true;
  readonly modelName: "deterministic-advisory-rules";
  readonly modelVersion: "phase-2.0";
  readonly generatedAt: string;
  readonly summary: string;
  readonly alerts: readonly AdvisoryAlert[];
  readonly confidence: ConfidenceResult;
}

/** Advisory-only analysis. It does not verify claims or make protocol decisions. */
export interface AdvisoryAIService {
  analyze(input: AdvisoryAnalysisInput): Promise<AdvisoryAnalysis>;
}

export class DeterministicAdvisoryAIService implements AdvisoryAIService {
  async analyze(input: AdvisoryAnalysisInput): Promise<AdvisoryAnalysis> {
    const alerts: AdvisoryAlert[] = [];
    if (input.confidence.score < 50) {
      alerts.push({
        type: "low_confidence",
        severity: input.confidence.score < 25 ? "high" : "medium",
        title: "Low confidence signal",
        message: `The deterministic confidence service scored this event at ${input.confidence.score}/100.`,
        recommendedAction: "Collect independent observations or review evidence metadata.",
        evidenceIds: [],
      });
    }
    const observationValues = input.observations.map((signal) => (signal.confidence > 1 ? signal.confidence / 100 : signal.confidence));
    if (observationValues.length > 1 && Math.max(...observationValues) - Math.min(...observationValues) >= 0.35) {
      alerts.push({
        type: "conflicting_signal",
        severity: "medium",
        title: "Conflicting observation signals",
        message: "Observation confidence values differ materially and should be reviewed by a human reviewer.",
        recommendedAction: "Compare source provenance and timestamps before changing event state.",
        evidenceIds: [],
      });
    }
    const duplicateWitnesses = input.observations.length - new Set(input.observations.map((signal) => signal.witnessId).filter(Boolean)).size;
    if (duplicateWitnesses > 0) {
      alerts.push({
        type: "duplicate_signal",
        severity: "low",
        title: "Repeated witness source",
        message: "More than one observation is associated with the same witness source.",
        recommendedAction: "Check whether repeated signals are independent before relying on them.",
        evidenceIds: [],
      });
    }

    return {
      eventId: input.eventId,
      advisoryOnly: true,
      modelName: "deterministic-advisory-rules",
      modelVersion: "phase-2.0",
      generatedAt: new Date().toISOString(),
      summary: alerts.length === 0 ? "No advisory alerts were generated." : `${alerts.length} advisory alert(s) require human review.`,
      alerts,
      confidence: input.confidence,
    };
  }
}

export const advisoryAIService: AdvisoryAIService = new DeterministicAdvisoryAIService();
