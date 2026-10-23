import type { ApiError } from "./error";

/** A cursor/page description accepted by collection endpoints. */
export interface PaginationQuery {
  readonly page?: number;
  readonly pageSize?: number;
  readonly cursor?: string;
  readonly limit?: number;
}

/** Pagination metadata returned by the API when a collection is paged. */
export interface PaginationMeta {
  readonly page?: number;
  readonly pageSize?: number;
  readonly total?: number;
  readonly totalPages?: number;
  readonly nextCursor?: string | null;
  readonly previousCursor?: string | null;
  readonly hasNext?: boolean;
  readonly hasPrevious?: boolean;
}

/** Normalized collection shape used by adapters regardless of server envelope. */
export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly pagination?: PaginationMeta;
}

export type DataSourceKind = "api" | "demo";
export type DataSourceFallbackReason = "demo-mode" | "backend-unavailable";

/** Metadata that lets the UI distinguish live API data from the Phase 1 mock path. */
export interface DataSourceMetadata {
  readonly kind: DataSourceKind;
  /** Alias exposed for callers that prefer a string source discriminator. */
  readonly source: DataSourceKind;
  readonly mode: DataSourceKind;
  readonly label: "API" | "DEMO";
  readonly endpoint: string;
  readonly isFallback: boolean;
  readonly fallbackReason?: DataSourceFallbackReason;
  readonly backendStatus?: number;
}

export interface ApiResult<T> {
  readonly data: T;
  readonly source: DataSourceMetadata;
  readonly pagination?: PaginationMeta;
}

export interface ApiQueryResult<T> {
  readonly data: T | null;
  readonly source: DataSourceMetadata | null;
  readonly pagination?: PaginationMeta;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: ApiError | null;
  readonly reload: () => void;
}

export type DataSourceMeta = DataSourceMetadata;
export type PageInfo = PaginationMeta;
export type PaginatedResult<T> = PaginatedResponse<T>;
export type ApiResponse<T> = ApiResult<T>;
