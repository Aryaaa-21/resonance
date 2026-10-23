import { ApiError } from "./error";

export type ApiHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface TransportRequest {
  readonly url: string;
  readonly method: ApiHttpMethod;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
}

export interface TransportResponse<T> {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: Headers;
  readonly data: T;
}

export interface ApiTransport {
  request<T>(request: TransportRequest): Promise<TransportResponse<T>>;
}

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/** Default browser/server transport. Adapters can inject another transport for tests or native clients. */
export class FetchTransport implements ApiTransport {
  private readonly fetcher: FetchLike;

  constructor(fetcher: FetchLike = fetch) {
    this.fetcher = fetcher;
  }

  async request<T>(request: TransportRequest): Promise<TransportResponse<T>> {
    let response: Response;

    try {
      response = await this.fetcher(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        signal: request.signal,
      });
    } catch (error) {
      throw ApiError.fromUnknown(error, { method: request.method, url: request.url });
    }

    const text = await response.text();
    let data: unknown = null;

    if (text.trim().length > 0) {
      try {
        data = JSON.parse(text) as unknown;
      } catch (error) {
        if (response.ok) {
          throw new ApiError({
            message: "The API returned malformed JSON.",
            code: "INVALID_JSON",
            kind: "parse",
            status: response.status,
            url: request.url,
            method: request.method,
            cause: error,
          });
        }
        data = text;
      }
    }

    return {
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      data: data as T,
    };
  }
}
