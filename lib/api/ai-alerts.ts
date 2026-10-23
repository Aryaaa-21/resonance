import type { AIAlert, AIAlertQuery } from "../../types";
import { getAIAlerts as getMockAIAlerts } from "../data";
import { apiClient, type ApiRequestOptions } from "./client";
import { listWithFallback, type AdapterClient } from "./adapters";
import type { ApiResult, PaginationQuery } from "./types";
import { normalizeAlert } from "./normalizers";

export type AIAlertListQuery = AIAlertQuery & PaginationQuery;

export const listAIAlerts = getAIAlerts;

export function getAIAlerts(query: AIAlertListQuery = {}, options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {}, client: AdapterClient = apiClient): Promise<ApiResult<readonly AIAlert[]>> {
  return listWithFallback<unknown>(client, "/ai/alerts", query, () => getMockAIAlerts(query), options).then((result) => ({ ...result, data: result.data.map(normalizeAlert) }));
}
