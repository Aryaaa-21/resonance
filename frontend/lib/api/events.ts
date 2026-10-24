import type { CreateVerificationRequestInput, Event, EventQuery } from "../../types";
import { createVerificationRequest as createMockVerificationRequest, getEvent as getMockEvent, getEvents as getMockEvents } from "../data";
import { apiClient, type ApiRequestOptions } from "./client";
import { createWithFallback, listWithFallback, resourceWithFallback, type AdapterClient } from "./adapters";
import type { ApiResult, PaginationQuery } from "./types";
import { normalizeEvent } from "./normalizers";

export type EventListQuery = EventQuery & PaginationQuery;

export const listEvents = getEvents;

export function getEvents(query: EventListQuery = {}, options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {}, client: AdapterClient = apiClient): Promise<ApiResult<readonly Event[]>> {
  return listWithFallback<unknown>(client, "/events", query, () => getMockEvents(query), options).then((result) => ({ ...result, data: result.data.map(normalizeEvent) }));
}


async function getMockEventWithLegacyId(id: string) {
  return (await getMockEvent(id)) ?? (id.startsWith("evt_") ? null : getMockEvent(`evt_${id}`));
}

export function getEvent(id: string, options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {}, client: AdapterClient = apiClient): Promise<ApiResult<Event | null>> {
  const apiId = id.startsWith("evt_") ? id : `evt_${id}`;
  return resourceWithFallback<unknown>(client, `/events/${encodeURIComponent(apiId)}`, () => getMockEventWithLegacyId(id), options).then((result) => ({ ...result, data: result.data ? normalizeEvent(result.data) : null }));
}

export function createVerificationRequest(input: CreateVerificationRequestInput, options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {}, client: AdapterClient = apiClient): Promise<ApiResult<Event>> {
  return createWithFallback< CreateVerificationRequestInput, unknown>(client, "/verification-requests", input, () => createMockVerificationRequest(input), options).then((result) => ({ ...result, data: normalizeEvent(result.data) }));
}
