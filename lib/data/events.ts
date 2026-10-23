import type { CreateVerificationRequestInput, Event, EventQuery } from "../../types";
import { TESTNET_SIMULATION, mockEvents } from "../mock";
import { applyLimit, simulateResponse } from "./shared";

/** Demo/simulation-only event registry backed by in-memory records. */
const eventStore: Event[] = mockEvents.map((event) => ({
  ...event,
  witnessIds: [...event.witnessIds],
  evidenceIds: [...event.evidenceIds],
  challengeIds: [...event.challengeIds],
  aiAlertIds: [...event.aiAlertIds],
}));

let nextRequestNumber = 1;

/** Returns mock events; no network or chain lookup is performed. */
export async function getEvents(query: EventQuery = {}): Promise<readonly Event[]> {
  const filtered = eventStore.filter((event) => {
    if (query.category !== undefined && event.category !== query.category) return false;
    if (query.status !== undefined && event.status !== query.status) return false;
    if (query.state !== undefined && event.state !== query.state) return false;
    return true;
  });

  return simulateResponse(applyLimit(filtered, query.limit));
}

/** Returns one mock event by id, or null when the demo registry has no match. */
export async function getEvent(id: string): Promise<Event | null> {
  const event = eventStore.find((candidate) => candidate.id === id) ?? null;
  return simulateResponse(event);
}

/**
 * Creates a pending in-memory simulation request and makes it readable through getEvent/getEvents.
 * This never submits a transaction, requests a signature, or claims an on-chain confirmation.
 */
export async function createVerificationRequest(
  input: CreateVerificationRequestInput,
): Promise<Event> {
  const title = input.title.trim();
  if (title.length === 0) {
    throw new TypeError("createVerificationRequest requires a non-empty title");
  }

  const now = new Date().toISOString();
  const event: Event = {
    id: `evt_request_${String(nextRequestNumber++).padStart(3, "0")}`,
    title,
    description: input.description?.trim() ?? "",
    category: input.category,
    location: input.location,
    occurredAt: input.occurredAt ?? now,
    reportedAt: now,
    status: "pending",
    state: "unverified",
    confidence: 0,
    witnessIds: [],
    evidenceIds: [],
    challengeIds: [],
    aiAlertIds: [],
    attestationId: null,
    requestedBy: input.requestedBy ?? null,
    simulation: TESTNET_SIMULATION,
  };

  eventStore.unshift(event);
  return simulateResponse(event);
}
