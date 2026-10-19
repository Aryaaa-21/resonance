import type { Actor, UserRole } from "./types";

export type Permission =
  | "read"
  | "create_verification_request"
  | "update_verification_request"
  | "cancel_verification_request"
  | "create_observation"
  | "create_evidence"
  | "manage_event"
  | "create_challenge"
  | "update_challenge"
  | "manage_witness"
  | "run_analysis";

export interface AuthorizationResource {
  readonly ownerId?: string | null;
  readonly projectOwnerId?: string | null;
  readonly raisedById?: string | null;
}

const elevatedRoles: ReadonlySet<UserRole> = new Set(["ADMIN", "REVIEWER", "SERVICE"]);

export function can(
  actor: Actor | null | undefined,
  permission: Permission,
  resource: AuthorizationResource = {},
): boolean {
  if (!actor) return false;
  if (permission === "read") return true;
  if (permission === "create_verification_request" || permission === "create_observation" || permission === "create_evidence" || permission === "create_challenge") {
    return true;
  }
  if (elevatedRoles.has(actor.role)) return true;
  if (permission === "manage_witness") return actor.role === "WITNESS" && resource.ownerId === actor.id;
  if (permission === "update_challenge") return resource.raisedById === actor.id;
  return resource.ownerId === actor.id || resource.projectOwnerId === actor.id;
}

export function assertCan(
  actor: Actor | null | undefined,
  permission: Permission,
  resource: AuthorizationResource = {},
): void {
  if (!can(actor, permission, resource)) {
    const error = new Error(`Not authorized for ${permission}`);
    error.name = "AuthorizationError";
    throw error;
  }
}
