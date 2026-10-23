/**
 * Demo/simulation-only transport helpers.
 * Replace this boundary with a real API or indexer client in a later phase.
 * No helper here submits, confirms, or reports a blockchain transaction.
 */
export const MOCK_RESPONSE_DELAY_MS = 8;

export function simulateResponse<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), MOCK_RESPONSE_DELAY_MS);
  });
}

export function applyLimit<T>(values: readonly T[], limit?: number): T[] {
  const safeLimit = limit === undefined ? values.length : Math.max(0, Math.floor(limit));
  return [...values].slice(0, safeLimit);
}
