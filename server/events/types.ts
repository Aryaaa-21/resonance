export type EventUpdate = {
  readonly type: "event.updated";
  readonly eventId: string;
  readonly changedAt: string;
  readonly source: "application" | "protocol" | "witness" | "challenge";
};

export type WitnessUpdate = {
  readonly type: "witness.updated";
  readonly witnessId: string;
  readonly changedAt: string;
};

export type ChallengeUpdate = {
  readonly type: "challenge.updated";
  readonly challengeId: string;
  readonly eventId: string;
  readonly changedAt: string;
};

export type NetworkUpdate = {
  readonly type: "network.updated";
  readonly changedAt: string;
  readonly metrics: Record<string, number | string>;
};

export type ResonanceUpdate = EventUpdate | WitnessUpdate | ChallengeUpdate | NetworkUpdate;
