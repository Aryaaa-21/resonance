import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryIdempotencyStore } from "./idempotency";

test("idempotency replays the first result and rejects payload reuse", async () => {
  const store = new InMemoryIdempotencyStore();
  let calls = 0;
  const operation = async () => ({ body: { id: ++calls }, status: 201 });
  const first = await store.execute("events:create", "key-1", { title: "same" }, operation);
  const replay = await store.execute("events:create", "key-1", { title: "same" }, operation);
  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.body, first.body);
  assert.equal(calls, 1);
  await assert.rejects(() => store.execute("events:create", "key-1", { title: "different" }, operation), { code: "IDEMPOTENCY_CONFLICT" });
});
