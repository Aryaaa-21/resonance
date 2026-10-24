export interface ChainSyncCheckpointValue {
  readonly lastSlot: bigint | null;
  readonly lastSignature: string | null;
}

/**
 * The first indexer boundary is monotonic ordering only. It prevents a retry
 * or out-of-order RPC response from moving the stored cursor backwards.
 */
export function shouldAdvanceCheckpoint(current: ChainSyncCheckpointValue | null, candidate: ChainSyncCheckpointValue): boolean {
  if (!current || current.lastSlot === null) return candidate.lastSlot !== null;
  if (candidate.lastSlot === null) return false;
  return candidate.lastSlot > current.lastSlot;
}
