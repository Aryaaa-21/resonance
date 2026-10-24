import type { Witness, WitnessQuery } from "../../types";
import { mockWitnesses } from "../mock";
import { applyLimit, simulateResponse } from "./shared";

/** Demo/simulation-only witness registry backed by isolated mock records. */
const witnessStore: readonly Witness[] = mockWitnesses;

/** Returns mock witnesses; no live registry or wallet lookup is performed. */
export async function getWitnesses(query: WitnessQuery = {}): Promise<readonly Witness[]> {
  const filtered = witnessStore.filter((witness) => {
    if (query.kind !== undefined && witness.kind !== query.kind) return false;
    if (query.status !== undefined && witness.status !== query.status) return false;
    return true;
  });

  return simulateResponse(applyLimit(filtered, query.limit));
}

/** Returns one mock witness by id, or null when there is no demo match. */
export async function getWitness(id: string): Promise<Witness | null> {
  return simulateResponse(witnessStore.find((witness) => witness.id === id) ?? null);
}
