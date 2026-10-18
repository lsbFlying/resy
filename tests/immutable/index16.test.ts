import { expect, test } from "vitest";
import { createStore } from "../../src";

/**
 * A symbol's description is not unique: two distinct symbols can share it.
 * Path keys must use a store-local id instead, otherwise the same object under
 * both keys shares one proxy and a write through one key lands on the other.
 */
test("immutable-object: same-description symbols keep separate paths", () => {
  const a = Symbol("same-description");
  const b = Symbol("same-description");
  const shared = { v: 1 };

  const store = createStore(
    { [a]: shared, [b]: shared },
    { immutable: true },
  );

  expect(store[a]).not.toBe(store[b]);

  store[a].v = 2;

  expect(store[a].v).toBe(2);
  expect(store[b].v).toBe(1);
});

test("immutable-object: symbol-keyed initial values are normalized from another store", () => {
  const key = Symbol("shared-value");
  const source = createStore({ [key]: { v: 1 } }, { immutable: true });
  const target = createStore({ [key]: source[key] }, { immutable: true });

  target[key].v = 2;

  expect(target[key].v).toBe(2);
  expect(source[key].v).toBe(1);
});
