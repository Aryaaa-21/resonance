export type ApiErrorKind = "http" | "network" | "parse" | "abort" | "unknown";

export interface ApiErrorInit {
  readonly message: string;
  readonly code: string;
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly url?: string;
  readonly method?: string;
  readonly cause?: unknown;
}

/** Structured failures shared by the transport, adapters, hooks, and UI. */
export class ApiError extends Error {
  readonly name = "ApiError";
  readonly code: string;
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly url?: string;
  readonly method?: string;
  readonly cause?: unknown;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.code = init.code;
    this.kind = init.kind;
    this.status = init.status;
    this.details = init.details;
    this.requestId = init.requestId;
    this.url = init.url;
    this.method = init.method;
    this.cause = init.cause;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  get isNetworkError() {
    return this.kind === "network";
  }

  get isAbortError() {
    return this.kind === "abort";
  }

  get retryable() {
    return this.isNetworkError || this.status === 408 || this.status === 429 || (this.status !== undefined && this.status >= 500);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      kind: this.kind,
      message: this.message,
      status: this.status,
      details: this.details,
      requestId: this.requestId,
      url: this.url,
      method: this.method,
    };
  }

  static fromUnknown(error: unknown, context: Pick<ApiErrorInit, "url" | "method"> = {}) {
    if (error instanceof ApiError) return error;

    if (isAbortException(error)) {
      return new ApiError({
        message: "The API request was cancelled.",
        code: "REQUEST_ABORTED",
        kind: "abort",
        ...context,
        cause: error,
      });
    }

    if (error instanceof SyntaxError) {
      return new ApiError({
        message: "The API returned malformed JSON.",
        code: "INVALID_JSON",
        kind: "parse",
        ...context,
        cause: error,
      });
    }

    if (error instanceof TypeError) {
      return new ApiError({
        message: "The configured API could not be reached.",
        code: "NETWORK_ERROR",
        kind: "network",
        ...context,
        cause: error,
      });
    }

    return new ApiError({
      message: error instanceof Error ? error.message : "The API request failed.",
      code: "REQUEST_FAILED",
      kind: "unknown",
      ...context,
      cause: error,
    });
  }
}

function isAbortException(error: unknown) {
  return typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError";
}
