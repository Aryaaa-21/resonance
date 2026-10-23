import type { AIAlert, AIAlertQuery } from "../../types";
import { mockAIAlerts } from "../mock";
import { applyLimit, simulateResponse } from "./shared";

/** Demo/simulation-only AI alert feed backed by isolated mock records. */
const alertStore: readonly AIAlert[] = mockAIAlerts;

/** Returns simulated AI alerts; no model is called at runtime. */
export async function getAIAlerts(query: AIAlertQuery = {}): Promise<readonly AIAlert[]> {
  const filtered = alertStore.filter((alert) => {
    if (query.eventId !== undefined && alert.eventId !== query.eventId) return false;
    if (query.severity !== undefined && alert.severity !== query.severity) return false;
    if (query.status !== undefined && alert.status !== query.status) return false;
    return true;
  });

  return simulateResponse(applyLimit(filtered, query.limit));
}
