import type { ApiClient } from "./client";
import type { ApiResult, PaginationQuery } from "./types";
import type { Attestation } from "@/types/attestation";
import { readPaginatedResponse, readResourceResponse } from "./response";

export interface PrepareProtocolAttestationInput {
  readonly mode: "solana";
  readonly eventNumber: string | number;
  readonly witnessOwner: string;
  readonly witnessId: string;
  readonly claim: boolean;
  readonly evidenceCommitment: string;
  readonly walletAddress: string;
}

export interface SyncProtocolAttestationInput {
  readonly attestationId: string;
  readonly transactionSignature: string;
}

export function listAttestations(client: Pick<ApiClient, "get">, query?: PaginationQuery & { eventId?: string; status?: string }): Promise<ApiResult<readonly Attestation[]>> {
  return client.get<unknown>("/attestations", { query }).then((payload) => ({ data: readPaginatedResponse<Attestation>(payload).items, source: { kind: "api", source: "api", mode: "api", label: "API", endpoint: "/attestations", isFallback: false } }));
}

export function prepareProtocolAttestation(client: Pick<ApiClient, "post">, eventId: string, input: PrepareProtocolAttestationInput): Promise<Attestation & { lifecycle: "built"; serializedTransaction: string }> {
  return client.post<unknown>(`/events/${encodeURIComponent(eventId)}/attestations`, input).then((payload) => readResourceResponse(payload) as Attestation & { lifecycle: "built"; serializedTransaction: string });
}

export function syncProtocolAttestation(client: Pick<ApiClient, "post">, input: SyncProtocolAttestationInput): Promise<Attestation & { lifecycle: string; error?: string | null }> {
  return client.post<unknown>("/attestations/sync", input).then((payload) => readResourceResponse(payload) as Attestation & { lifecycle: string; error?: string | null });
}
