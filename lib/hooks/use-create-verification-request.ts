"use client";

import { useCallback, useState } from "react";
import type { CreateVerificationRequestInput, Event } from "../../types";
import { createVerificationRequest } from "../api/verification-requests";
import { ApiError } from "../api/error";
import type { DataSourceMetadata } from "../api/types";

export function useCreateVerificationRequest() {
  const [data, setData] = useState<Event | null>(null);
  const [source, setSource] = useState<DataSourceMetadata | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (input: CreateVerificationRequestInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createVerificationRequest(input);
      setData(result.data);
      setSource(result.source);
      return result;
    } catch (unknownError) {
      const nextError = unknownError instanceof ApiError ? unknownError : ApiError.fromUnknown(unknownError);
      setError(nextError);
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, source, error, isLoading, mutate };
}
