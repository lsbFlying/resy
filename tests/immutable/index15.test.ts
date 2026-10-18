import vm from "node:vm";
import { expect, test } from "vitest";
import { createStore } from "../../src";

/**
 * Array methods must be identified by the array's own realm, not by the
 * current realm's `Array.prototype`. A cross-realm array's `entries()` still
 * yields `[index, value]` pairs; treating those pairs as elements would wrap
 * the pair itself and hand the consumer a proxy array instead of the value.
 */
test("immutable-array: cross-realm entries keep the [index, value] shape", () => {
  const foreign = vm.runInNewContext("[{ id: 1 }, { id: 2 }]");
  const store = createStore(
    { list: foreign as { id: number }[] },
    { immutable: true },
  );

  const entries = [...store.list.entries()];

  expect(entries).toHaveLength(2);
  expect(entries[0][0]).toBe(0);
  expect(Array.isArray(entries[0][1])).toBe(false);
  expect((entries[0][1] as { id: number }).id).toBe(1);
});
