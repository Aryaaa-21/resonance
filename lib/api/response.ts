import type { PaginationMeta, PaginatedResponse } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function asStringOrNull(value: unknown) {
  return typeof value === "string" || value === null ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

export function readPagination(value: unknown): PaginationMeta | undefined {
  const record = asRecord(value);
  if (!record) return undefined;

  const paginationContainer = asRecord(record.pagination) ?? asRecord(record.meta);
  const source = asRecord(paginationContainer?.pagination) ?? paginationContainer ?? record;
  const pagination: PaginationMeta = {
    page: asNumber(source.page) ?? asNumber(source.currentPage),
    pageSize: asNumber(source.pageSize) ?? asNumber(source.perPage) ?? asNumber(source.limit),
    total: asNumber(source.total) ?? asNumber(source.totalCount),
    totalPages: asNumber(source.totalPages) ?? asNumber(source.pageCount),
    nextCursor: asStringOrNull(source.nextCursor) ?? asStringOrNull(source.next),
    previousCursor: asStringOrNull(source.previousCursor) ?? asStringOrNull(source.previous),
    hasNext: asBoolean(source.hasNext) ?? asBoolean(source.hasMore) ?? asBoolean(source.hasNextPage),
    hasPrevious: asBoolean(source.hasPrevious),
  };

  const hasValue = Object.values(pagination).some((item) => item !== undefined);
  return hasValue ? pagination : undefined;
}

/** Accepts arrays and common `{ data/items, pagination/meta }` API envelopes. */
export function readPaginatedResponse<T>(payload: unknown): PaginatedResponse<T> {
  if (Array.isArray(payload)) {
    return { items: payload as T[] };
  }

  const record = asRecord(payload);
  if (!record) return { items: [] };

  const nestedData = asRecord(record.data);
  const items = firstArray<T>(
    record.items,
    record.results,
    record.records,
    record.data,
    nestedData?.items,
    nestedData?.results,
    nestedData?.records,
  );

  return {
    items,
    pagination: readPagination(record.pagination) ?? readPagination(record.meta) ?? readPagination(nestedData?.pagination) ?? readPagination(nestedData?.meta),
  };
}

/** Unwraps a single resource from `{ data: ... }` without assuming an envelope. */
export function readResourceResponse<T>(payload: unknown): T {
  const record = asRecord(payload);
  if (record && "data" in record && !Array.isArray(record.data)) {
    return record.data as T;
  }
  return payload as T;
}

function firstArray<T>(...candidates: unknown[]) {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [] as T[];
}
