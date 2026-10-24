"use client";

import type { AIAlertQuery, ChallengeQuery, EventQuery, WitnessQuery } from "../../types";
import { getAIAlerts, type AIAlertListQuery } from "../api/ai-alerts";
import { getChallenges, type ChallengeListQuery } from "../api/challenges";
import { getEvent, getEvents, type EventListQuery } from "../api/events";
import { getNetworkStats } from "../api/network";
import { getVerificationRequests, type VerificationRequestQuery } from "../api/verification-requests";
import { getWitness, getWitnesses, type WitnessListQuery } from "../api/witnesses";
import { useApiQuery } from "./use-api-query";

function queryKey(query: unknown) {
  return JSON.stringify(query ?? {});
}

export function useEvents(query: EventListQuery = {}) {
  return useApiQuery((signal) => getEvents(query, { signal }), { queryKey: [queryKey(query)] });
}

export function useEvent(id: string | null | undefined) {
  return useApiQuery((signal) => getEvent(id ?? "", { signal }), {
    enabled: Boolean(id),
    queryKey: [id],
  });
}

export function useVerificationRequests(query: VerificationRequestQuery = {}) {
  return useApiQuery((signal) => getVerificationRequests(query, { signal }), { queryKey: [queryKey(query)] });
}

export function useWitnesses(query: WitnessListQuery = {}) {
  return useApiQuery((signal) => getWitnesses(query, { signal }), { queryKey: [queryKey(query)] });
}

export function useWitness(id: string | null | undefined) {
  return useApiQuery((signal) => getWitness(id ?? "", { signal }), {
    enabled: Boolean(id),
    queryKey: [id],
  });
}

export function useChallenges(query: ChallengeListQuery = {}) {
  return useApiQuery((signal) => getChallenges(query, { signal }), { queryKey: [queryKey(query)] });
}

export function useNetworkStats() {
  return useApiQuery((signal) => getNetworkStats({ signal }), { queryKey: ["network-stats"] });
}

export function useAIAlerts(query: AIAlertListQuery = {}) {
  return useApiQuery((signal) => getAIAlerts(query, { signal }), { queryKey: [queryKey(query)] });
}

// These aliases keep the hook boundary discoverable to callers that use the domain query names.
export type { AIAlertListQuery, ChallengeListQuery, EventListQuery, VerificationRequestQuery, WitnessListQuery };
export type { AIAlertQuery, ChallengeQuery, EventQuery, WitnessQuery };
