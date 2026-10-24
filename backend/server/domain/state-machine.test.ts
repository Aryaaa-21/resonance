import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionEventState, transitionEventState, InvalidEventTransitionError } from "./state-machine";

test("event state machine permits only explicit transitions", () => {
  assert.equal(canTransitionEventState("unverified", "review"), true);
  assert.equal(transitionEventState("review", "verified"), "verified");
  assert.equal(canTransitionEventState("unverified", "verified"), false);
  assert.throws(() => transitionEventState("unverified", "verified"), InvalidEventTransitionError);
});
