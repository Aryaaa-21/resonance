/**
 * Phase 1 data boundary.
 *
 * Every export is demo/simulation-only and reads isolated in-memory records. The create
 * function only adds a pending local request; it never submits or confirms a blockchain action.
 */
export { createVerificationRequest, getEvent, getEvents } from "./events";
export { getWitness, getWitnesses } from "./witnesses";
export { getChallenges } from "./challenges";
export { getNetworkStats } from "./network";
export { getAIAlerts } from "./ai-alerts";
