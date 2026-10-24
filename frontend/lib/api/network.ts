import type { NetworkStats } from "../../types";
import { getNetworkStats as getMockNetworkStats } from "../data";
import { apiClient, type ApiRequestOptions } from "./client";
import { resourceWithFallback, type AdapterClient } from "./adapters";
import type { ApiResult } from "./types";
import { normalizeNetworkStats } from "./normalizers";

export function getNetworkStats(options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {}, client: AdapterClient = apiClient): Promise<ApiResult<NetworkStats>> {
  return resourceWithFallback<unknown>(client, "/network/stats", getMockNetworkStats, options).then((result) => ({ ...result, data: normalizeNetworkStats(result.data) }));
}
