import type { CreateVerificationRequestInput, Event, EventQuery } from "../../types";
import { createVerificationRequest as createMockVerificationRequest, getEvent as getMockEvent, getEvents as getMockEvents } from "../data";
import { apiClient, type ApiRequestOptions } from "./client";
import { createWithFallback, listWithFallback, resourceWithFallback, type AdapterClient } from "./adapters";
import type { ApiResult, PaginationQuery } from "./types";
import { normalizeEvent } from "./normalizers";

export type VerificationRequest = Event;
export type VerificationRequestQuery = EventQuery & PaginationQuery;

export const listVerificationRequests = getVerificationRequests;

export function getVerificationRequests(query: VerificationRequestQuery = {}, options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {}, client: AdapterClient = apiClient): Promise<ApiResult<readonly VerificationRequest[]>> {
  return listWithFallback<unknown>(client, "/verification-requests", query, () => getMockEvents(query), options).then((result) => ({ ...result, data: result.data.map(normalizeEvent) }));
}

async function getMockEventWithLegacyId(id: string) {
  return (await getMockEvent(id)) ?? (id.startsWith("evt_") ? null : getMockEvent(`evt_${id}`));
}

export function getVerificationRequest(id: string, options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {}, client: AdapterClient = apiClient): Promise<ApiResult<VerificationRequest | null>> {
  return resourceWithFallback<unknown>(client, `/verification-requests/${encodeURIComponent(id)}`, () => getMockEventWithLegacyId(id), options).then((result) => ({ ...result, data: result.data ? normalizeEvent(result.data) : null }));
}

export function createVerificationRequest(input: CreateVerificationRequestInput, options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {}, client: AdapterClient = apiClient): Promise<ApiResult<VerificationRequest>> {
  return createWithFallback< CreateVerificationRequestInput, unknown>(client, "/verification-requests", input, () => createMockVerificationRequest(input), options).then((result) => ({ ...result, data: normalizeEvent(result.data) }));
}
