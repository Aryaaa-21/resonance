import type { Challenge, ChallengeQuery } from "../../types";
import { mockChallenges } from "../mock";
import { applyLimit, simulateResponse } from "./shared";

/** Demo/simulation-only challenge queue backed by isolated mock records. */
const challengeStore: readonly Challenge[] = mockChallenges;

/** Returns mock challenge records; no dispute contract or chain state is queried. */
export async function getChallenges(query: ChallengeQuery = {}): Promise<readonly Challenge[]> {
  const filtered = challengeStore.filter((challenge) => {
    if (query.eventId !== undefined && challenge.eventId !== query.eventId) return false;
    if (query.status !== undefined && challenge.status !== query.status) return false;
    return true;
  });

  return simulateResponse(applyLimit(filtered, query.limit));
}
