import { createHash } from "node:crypto";
import type { ProtocolAdapter } from "./interface";
import type { ProtocolPreparationResult, ProtocolPublicationRequest, ProtocolPublicationResult, ProtocolSyncRequest, ProtocolSyncResult } from "./types";

/** Explicit fallback adapter: it never signs, submits, or invents a chain signature. */
export class DemoProtocolAdapter implements ProtocolAdapter {
  readonly name = "demo-local-adapter";
  readonly kind = "demo" as const;

  async prepareAttestation(input: ProtocolPublicationRequest): Promise<ProtocolPreparationResult> {
    const digest = createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 64);
    return {
      lifecycle: "built",
      network: "demo",
      programId: "not-configured",
      serializedTransaction: "",
      eventPda: "",
      witnessPda: "",
      attestationPda: "",
      challengePda: null,
      commitment: input.evidenceCommitment,
      expectedInstructionData: "",
      expectedInstructionAccounts: [],
      expectedSubmitter: "",
      explorerUrl: null,
    };
  }

  async publishAttestation(input: ProtocolPublicationRequest): Promise<ProtocolPublicationResult> {
    const digest = createHash("sha256").update(`${input.eventId}:${input.evidenceCommitment}:${input.network ?? "demo"}:${input.programId ?? "not-configured"}`).digest("hex").slice(0, 24);
    return {
      status: "simulated",
      adapterReference: `demo-attestation:${digest}`,
      isSimulation: true,
      notice: "DEMO ONLY: local adapter reference; no transaction signature or on-chain publication exists.",
    };
  }

  async syncAttestation(_input: ProtocolSyncRequest): Promise<ProtocolSyncResult> {
    throw new Error("The demo adapter has no chain transaction to sync");
  }
}

export const demoProtocolAdapter = new DemoProtocolAdapter();
