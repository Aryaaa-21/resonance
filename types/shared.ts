export type EntityId = string;

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracyMeters?: number;
}

export interface EventLocation {
  readonly label: string;
  readonly city: string;
  readonly region: string;
  readonly country: string;
  readonly coordinates?: Coordinates;
  /** Application-only radius used to scope witness observations. */
  readonly observationRadiusMeters?: number;
}

export interface TokenAmount {
  readonly amount: number;
  readonly symbol: string;
}
