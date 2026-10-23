import { getApiRuntimeConfig, type ApiRuntimeConfig } from "./config";
import { ApiError } from "./error";
import type { ApiHttpMethod, ApiTransport } from "./transport";
import { FetchTransport } from "./transport";

export interface ApiRequestOptions {
  readonly method?: ApiHttpMethod;
  readonly query?: object;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly signal?: AbortSignal;
}

export interface ApiClientConfig {
  readonly runtime?: ApiRuntimeConfig;
  readonly transport?: ApiTransport;
}

function getHeader(headers: Headers, name: string) {
  return headers.get(name) ?? undefined;
}

export function appendQuery(path: string, query?: ApiRequestOptions["query"]) {
  if (!query) return path;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, string | number | boolean | null | undefined>)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const encoded = params.toString();
  if (!encoded) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${encoded}`;
}

function resolveUrl(baseUrl: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (/^https?:\/\//i.test(baseUrl)) {
    return `${baseUrl}${normalizedPath}`;
  }

  return `${baseUrl}${normalizedPath}`;
}

export class ApiClient {
  private readonly configuredRuntime?: ApiRuntimeConfig;
  private readonly transport: ApiTransport;

  get runtime() {
    return this.configuredRuntime ?? getApiRuntimeConfig();
  }

  constructor(config: ApiClientConfig = {}) {
    this.configuredRuntime = config.runtime;
    this.transport = config.transport ?? new FetchTransport();
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const method = options.method ?? "GET";
    const requestPath = appendQuery(path, options.query);
    const url = resolveUrl(this.runtime.apiUrl, requestPath);
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    };

    let response;
    try {
      response = await this.transport.request<T>({
        url,
        method,
        headers,
        body: options.body,
        signal: options.signal,
      });
    } catch (error) {
      throw ApiError.fromUnknown(error, { method, url });
    }

    if (!response.ok) {
      const payload = response.data as unknown;
      const message = extractErrorMessage(payload) ?? `API request failed with status ${response.status}.`;
      throw new ApiError({
        message,
        code: extractErrorCode(payload) ?? `HTTP_${response.status}`,
        kind: "http",
        status: response.status,
        details: extractErrorDetails(payload),
        requestId: getHeader(response.headers, "x-request-id") ?? getHeader(response.headers, "x-correlation-id") ?? extractRequestId(payload),
        url,
        method,
      });
    }

    return response.data;
  }

  get<T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  put<T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  patch<T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export function createApiClient(config: ApiClientConfig = {}) {
  return new ApiClient(config);
}

export const apiClient = createApiClient();

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function extractErrorMessage(payload: unknown) {
  if (typeof payload === "string" && payload.trim()) return payload;
  const record = asRecord(payload);
  if (!record) return undefined;
  if (typeof record.message === "string") return record.message;
  if (typeof record.error === "string") return record.error;
  const nested = asRecord(record.error);
  return typeof nested?.message === "string" ? nested.message : undefined;
}

function extractErrorCode(payload: unknown) {
  const record = asRecord(payload);
  if (!record) return undefined;
  if (typeof record.code === "string") return record.code;
  const nested = asRecord(record.error);
  return typeof nested?.code === "string" ? nested.code : undefined;
}

function extractErrorDetails(payload: unknown) {
  const record = asRecord(payload);
  if (!record) return payload;
  if ("details" in record) return record.details;
  const nested = asRecord(record.error);
  return nested?.details ?? payload;
}

function extractRequestId(payload: unknown) {
  const record = asRecord(payload);
  if (!record) return undefined;
  if (typeof record.requestId === "string") return record.requestId;
  const nested = asRecord(record.error);
  return typeof nested?.requestId === "string" ? nested.requestId : undefined;
}
