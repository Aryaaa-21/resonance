import type { Witness, WitnessQuery } from "../../types";
import { getWitness as getMockWitness, getWitnesses as getMockWitnesses } from "../data";
import { apiClient, type ApiRequestOptions } from "./client";
import { listWithFallback, resourceWithFallback, type AdapterClient } from "./adapters";
import type { ApiResult, PaginationQuery } from "./types";
import { normalizeWitness } from "./normalizers";

export type WitnessListQuery = WitnessQuery & PaginationQuery;

export const listWitnesses = getWitnesses;

export function getWitnesses(query: WitnessListQuery = {}, options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {}, client: AdapterClient = apiClient): Promise<ApiResult<readonly Witness[]>> {
  return listWithFallback<unknown>(client, "/witnesses", query, () => getMockWitnesses(query), options).then((result) => ({ ...result, data: result.data.map(normalizeWitness) }));
}

export function getWitness(id: string, options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {}, client: AdapterClient = apiClient): Promise<ApiResult<Witness | null>> {
  return resourceWithFallback<unknown>(client, `/witnesses/${encodeURIComponent(id)}`, () => getMockWitness(id), options).then((result) => ({ ...result, data: result.data ? normalizeWitness(result.data) : null }));
}
