import { getApiRuntimeConfig } from "./config";
import { ApiError } from "./error";
import type { ApiResult, DataSourceMetadata, PaginationMeta } from "./types";

export interface AdapterContext {
  readonly endpoint: string;
}

export function apiSource(endpoint: string): DataSourceMetadata {
  return {
    kind: "api",
    source: "api",
    mode: "api",
    label: "API",
    endpoint,
    isFallback: false,
  };
}

export function demoSource(endpoint: string, fallbackReason: "demo-mode" | "backend-unavailable", error?: ApiError): DataSourceMetadata {
  return {
    kind: "demo",
    source: "demo",
    mode: "demo",
    label: "DEMO",
    endpoint,
    isFallback: fallbackReason === "backend-unavailable",
    fallbackReason,
    backendStatus: error?.status,
  };
}

export function isBackendUnavailable(error: ApiError) {
  return error.isNetworkError || error.status === 404 || error.status === 502 || error.status === 503 || error.status === 504;
}

export function canUseDemoFallback(error: ApiError) {
  const config = getApiRuntimeConfig();
  return config.devFallbackEnabled && !config.demoMode && !error.isAbortError && isBackendUnavailable(error);
}

export async function withDemoFallback<T>(
  context: AdapterContext,
  request: () => Promise<{ data: T; pagination?: PaginationMeta }>,
  demo: () => Promise<{ data: T; pagination?: PaginationMeta }>,
): Promise<ApiResult<T>> {
  const config = getApiRuntimeConfig();

  if (config.demoMode) {
    const result = await demo();
    return {
      ...result,
      source: demoSource(context.endpoint, "demo-mode"),
    };
  }

  try {
    const result = await request();
    return {
      ...result,
      source: apiSource(context.endpoint),
    };
  } catch (unknownError) {
    const error = unknownError instanceof ApiError ? unknownError : ApiError.fromUnknown(unknownError, { url: context.endpoint });
    // Demo fallback is deliberately development-only. Production must surface the
    // real API failure instead of presenting local records as operational data.
    if (!canUseDemoFallback(error) || config.environment === "production") throw error;

    const result = await demo();
    return {
      ...result,
      source: demoSource(context.endpoint, "backend-unavailable", error),
    };
  }
}
