import type { ApiClient, ApiRequestOptions } from "./client";
import type { ApiResult, PaginationQuery } from "./types";
import { readPaginatedResponse, readResourceResponse } from "./response";
import { withDemoFallback } from "./source";

export type AdapterClient = Pick<ApiClient, "get" | "post">;

export function listWithFallback<T>(
  client: AdapterClient,
  endpoint: string,
  query: PaginationQuery | undefined,
  demo: () => Promise<readonly T[]>,
  options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {},
): Promise<ApiResult<readonly T[]>> {
  return withDemoFallback(
    { endpoint },
    async () => {
      const payload = await client.get<unknown>(endpoint, { ...options, query });
      const page = readPaginatedResponse<T>(payload);
      return { data: page.items, pagination: page.pagination };
    },
    async () => ({ data: await demo() }),
  );
}

export function resourceWithFallback<T>(
  client: AdapterClient,
  endpoint: string,
  demo: () => Promise<T>,
  options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {},
): Promise<ApiResult<T>> {
  return withDemoFallback(
    { endpoint },
    async () => ({ data: readResourceResponse<T>(await client.get<unknown>(endpoint, options)) }),
    async () => ({ data: await demo() }),
  );
}

export function createWithFallback<TInput, TOutput>(
  client: AdapterClient,
  endpoint: string,
  input: TInput,
  demo: () => Promise<TOutput>,
  options: Omit<ApiRequestOptions, "method" | "body" | "query"> = {},
): Promise<ApiResult<TOutput>> {
  return withDemoFallback(
    { endpoint },
    async () => ({ data: readResourceResponse<TOutput>(await client.post<unknown>(endpoint, input, options)) }),
    async () => ({ data: await demo() }),
  );
}

export type AdapterResult<T> = ApiResult<T>;
