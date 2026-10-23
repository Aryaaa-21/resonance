import type { Challenge, ChallengeQuery } from "../../types";
import { getChallenges as getMockChallenges } from "../data";
import { apiClient, type ApiRequestOptions } from "./client";
import { listWithFallback, type AdapterClient } from "./adapters";
import type { ApiResult, PaginationQuery } from "./types";
import { normalizeChallenge } from "./normalizers";

export type ChallengeListQuery = ChallengeQuery & PaginationQuery;

export const listChallenges = getChallenges;

export function getChallenges(query: ChallengeListQuery = {}, options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {}, client: AdapterClient = apiClient): Promise<ApiResult<readonly Challenge[]>> {
  return listWithFallback<unknown>(client, "/challenges", query, () => getMockChallenges(query), options).then((result) => ({ ...result, data: result.data.map(normalizeChallenge) }));
}
