import type { EventState } from "./types";

const VALID_TRANSITIONS: Readonly<Record<EventState, readonly EventState[]>> = {
  unverified: ["review", "rejected"],
  review: ["verified", "challenged", "rejected"],
  verified: ["challenged", "rejected"],
  challenged: ["review", "verified", "rejected"],
  rejected: ["review"],
};

export class InvalidEventTransitionError extends Error {
  readonly code = "INVALID_EVENT_TRANSITION" as const;
  readonly from: EventState;
  readonly to: EventState;

  constructor(from: EventState, to: EventState) {
    super(`Event state cannot transition from ${from} to ${to}`);
    this.name = "InvalidEventTransitionError";
    this.from = from;
    this.to = to;
  }
}

export function validEventTransitions(from: EventState): readonly EventState[] {
  return VALID_TRANSITIONS[from];
}

export function canTransitionEventState(from: EventState, to: EventState): boolean {
  return from === to || VALID_TRANSITIONS[from].includes(to);
}

export function transitionEventState(from: EventState, to: EventState): EventState {
  if (!canTransitionEventState(from, to)) {
    throw new InvalidEventTransitionError(from, to);
  }
  return to;
}
