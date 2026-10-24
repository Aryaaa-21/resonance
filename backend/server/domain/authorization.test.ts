import assert from "node:assert/strict";
import test from "node:test";
import { can } from "./authorization";

test("authorization permits owners and elevated reviewers", () => {
  const user = { id: "u1", role: "USER" as const };
  const reviewer = { id: "u2", role: "REVIEWER" as const };
  assert.equal(can(user, "manage_event", { ownerId: "u1" }), true);
  assert.equal(can(user, "manage_event", { ownerId: "u9" }), false);
  assert.equal(can(reviewer, "manage_event", { ownerId: "u9" }), true);
  assert.equal(can(undefined, "read"), false);
  assert.equal(can(user, "create_challenge"), true);
});
