"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/error";
import type { ApiQueryResult, ApiResult } from "../api/types";

export type ApiQueryFactory<T> = (signal: AbortSignal) => Promise<ApiResult<T>>;

export interface UseApiQueryOptions<T> {
  readonly enabled?: boolean;
  readonly queryKey?: readonly unknown[];
  readonly initialData?: T | null;
  readonly isEmpty?: (data: T | null) => boolean;
}

const EMPTY_QUERY_KEY: readonly unknown[] = [];

/** Small dependency-free async query helper for adapter-backed client components. */
export function useApiQuery<T>(factory: ApiQueryFactory<T>, options: UseApiQueryOptions<T> = {}): ApiQueryResult<T> {
  const { enabled = true, queryKey = EMPTY_QUERY_KEY, initialData = null, isEmpty: isEmptyOption } = options;
  const factoryRef = useRef(factory);
  const [data, setData] = useState<T | null>(initialData);
  const [source, setSource] = useState<ApiQueryResult<T>["source"]>(null);
  const [pagination, setPagination] = useState<ApiQueryResult<T>["pagination"]>();
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [reloadToken, setReloadToken] = useState(0);

  factoryRef.current = factory;

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setIsLoading(true);
    setError(null);

    void factoryRef.current(controller.signal)
      .then((result) => {
        if (!active) return;
        setData(result.data);
        setSource(result.source);
        setPagination(result.pagination);
        setIsLoading(false);
      })
      .catch((unknownError: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(unknownError instanceof ApiError ? unknownError : ApiError.fromUnknown(unknownError));
        setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, reloadToken, ...queryKey]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);
  const isEmpty = isEmptyOption ? isEmptyOption(data) : data === null || (Array.isArray(data) && data.length === 0);

  return { data, source, pagination, isLoading, isEmpty, error, reload };
}
