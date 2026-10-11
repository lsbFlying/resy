import { expect, test } from "vitest";
import { createStore } from "../../src";
import { rawMetaStore, rawState } from "../__utils__";

/**
 * @description Array mutation semantics (tasks 3.2 – 3.8), mirroring the
 * scenarios of `specs/state-update-semantics`.
 *
 * The wrapper is generic (it never inspects a method name), so these tests
 * deliberately assert the *contract* rather than a list of methods: new
 * ECMAScript mutators must keep working without touching this file.
 */

type ListState = {
  list: number[];
  nested: { arr: number[] };
  other: { keep: number };
};

const build = () =>
  createStore<ListState>(
    {
      list: [3, 1, 2],
      nested: { arr: [1, 2] },
      other: { keep: 1 },
    },
    { immutable: true },
  );

test("array: a mutating method replaces the array without touching the old one", () => {
  const store = build();
  const before = rawState<ListState>(store);
  const beforeList = before.list;

  store.list.push(99);

  const after = rawState<ListState>(store);
  expect(after.list).toEqual([3, 1, 2, 99]);
  // The array and the root gain new identities …
  expect(after.list).not.toBe(beforeList);
  expect(after).not.toBe(before);
  // … the previously held array keeps its contents …
  expect(beforeList).toEqual([3, 1, 2]);
  // … and the branch outside the path keeps sharing its reference.
  expect(after.other).toBe(before.other);
});

test("array: pop and shift no longer throw nor destroy the array", () => {
  const popStore = build();
  const popBefore = rawState<ListState>(popStore);
  expect(() => popStore.list.pop()).not.toThrow();
  expect(rawState<ListState>(popStore).list).toEqual([3, 1]);
  // The array as it existed before the call is intact.
  expect(popBefore.list).toEqual([3, 1, 2]);

  const shiftStore = build();
  const shiftBefore = rawState<ListState>(shiftStore);
  expect(() => shiftStore.list.shift()).not.toThrow();
  expect(rawState<ListState>(shiftStore).list).toEqual([1, 2]);
  expect(shiftBefore.list).toEqual([3, 1, 2]);
});

test("array: sort and reverse match native results", () => {
  const asc = build();
  asc.list.sort((a, b) => a - b);
  expect(rawState<ListState>(asc).list).toEqual([1, 2, 3]);

  const desc = build();
  desc.list.sort((a, b) => b - a);
  expect(rawState<ListState>(desc).list).toEqual([3, 2, 1]);

  const rev = build();
  rev.list.reverse();
  expect(rawState<ListState>(rev).list).toEqual([2, 1, 3]);
});

test("array: splice, fill, copyWithin and length assignment match native results", () => {
  const sp = build();
  sp.list.splice(1, 1, 7, 8);
  expect(rawState<ListState>(sp).list).toEqual([3, 7, 8, 2]);

  const fl = build();
  fl.list.fill(9, 1, 2);
  expect(rawState<ListState>(fl).list).toEqual([3, 9, 2]);

  const cw = build();
  cw.list.copyWithin(0, 1);
  expect(rawState<ListState>(cw).list).toEqual([1, 2, 2]);

  const ln = build();
  ln.list.length = 2;
  expect(rawState<ListState>(ln).list).toEqual([3, 1]);
});

test("array: the host object is cloned, not shared (guards against a missing host in the commit path)", () => {
  const store = build();
  const before = rawState<ListState>(store);
  const beforeNested = before.nested;
  const beforeArr = before.nested.arr;

  store.nested.arr.push(9);

  const after = rawState<ListState>(store);
  expect(after.nested.arr).toEqual([1, 2, 9]);
  // All three levels must be new. If the commit path omitted the host, the
  // value would still look right while the old snapshot kept sharing the array.
  expect(after.nested.arr).not.toBe(beforeArr);
  expect(after.nested).not.toBe(beforeNested);
  expect(after).not.toBe(before);
  // The old snapshot is fully frozen.
  expect(beforeNested.arr).toEqual([1, 2]);
  // Unrelated branch keeps identity.
  expect(after.other).toBe(before.other);
});

test("array: every call commits exactly once, regardless of internal writes", async () => {
  const store = build();
  const ms = rawMetaStore<ListState>(store);

  let notifications = 0;
  store.subscribe(() => { notifications++; });

  // `push` performs two internal writes (index + length); one commit expected.
  store.list.push(4);
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(notifications).toBe(1);

  // Three mutators inside one synchronous block collapse into a single batch.
  store.list.push(5);
  store.list.sort((a, b) => a - b);
  store.list.pop();
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(notifications).toBe(2);
  expect(ms._$state_.list).toEqual([1, 2, 3, 4]);
});

test("array: a method that does not exist yet is covered without name enumeration", async () => {
  const store = build();
  const ms = rawMetaStore<ListState>(store);

  // Simulates a future ECMAScript mutator: the name appears nowhere in src/.
  (Array.prototype as unknown as Record<string, unknown>).__resyFutureMutate = function (
    this: number[],
    value: number,
  ) {
    const next = this.length;
    this[next] = value;
    return this.length;
  };

  try {
    const result = (store.list as unknown as Record<string, (v: number) => number>)
      .__resyFutureMutate(42);
    expect(result).toBe(4);
    expect(ms._$state_.list).toEqual([3, 1, 2, 42]);
    // A real commit happened, so the root moved on.
    expect(ms._$state_.list).not.toBe([3, 1, 2]);
  } finally {
    delete (Array.prototype as unknown as Record<string, unknown>).__resyFutureMutate;
  }
});

test("array: read-only methods return native results and produce no update", async () => {
  const store = build();
  const ms = rawMetaStore<ListState>(store);
  const before = rawState<ListState>(store);
  const beforeList = before.list;

  const notifications: number[] = [];
  store.subscribe(() => { notifications.push(1); });

  expect(store.list.slice(1)).toEqual([1, 2]);
  expect(store.list.map((x) => x * 2)).toEqual([6, 2, 4]);
  expect(store.list.filter((x) => x > 1)).toEqual([3, 2]);
  expect(store.list.concat([9])).toEqual([3, 1, 2, 9]);
  expect(store.list.join("-")).toBe("3-1-2");
  expect(store.list.indexOf(1)).toBe(1);
  expect(store.list.includes(2)).toBe(true);
  expect(store.list.reduce((acc, x) => acc + x, 0)).toBe(6);

  await new Promise((resolve) => setTimeout(resolve, 20));

  // No new tree, no re-derived array, no pending task, no notification.
  expect(rawState<ListState>(store)).toBe(before);
  expect(rawState<ListState>(store).list).toBe(beforeList);
  expect(ms._scheduler_.taskData).toEqual({});
  expect(notifications.length).toBe(0);
});

test("array: mutating after a whole-array replacement acts on the new array", () => {
  const store = build();
  const ms = rawMetaStore<ListState>(store);

  store.list.push(3);
  expect(ms._$state_.list).toEqual([3, 1, 2, 3]);

  store.list = [9, 9];
  expect(ms._$state_.list).toEqual([9, 9]);
  // Reading right after the replacement must already reflect it.
  expect(store.list).toEqual([9, 9]);

  store.list.push(7);
  expect(ms._$state_.list).toEqual([9, 9, 7]);
});

test("array: chaining contract — push returns a length, sort/reverse return the proxy", () => {
  const store = build();
  const ms = rawMetaStore<ListState>(store);
  // One proxy instance for the whole test: without the path cache a fresh read
  // yields a different wrapper, so identity must be compared against a single
  // held reference.
  const list = store.list;

  const length = list.push(4);
  expect(length).toBe(4);
  expect(ms._$state_.list).toEqual([3, 1, 2, 4]);

  const sorted = list.sort((a, b) => a - b);
  expect(sorted).toBe(list);
  expect(ms._$state_.list).toEqual([1, 2, 3, 4]);

  const reversed = list.reverse();
  expect(reversed).toBe(list);
  expect(ms._$state_.list).toEqual([4, 3, 2, 1]);

  // Chaining through the returned proxy continues to commit correctly.
  list.sort((a, b) => a - b).push(0);
  expect(ms._$state_.list).toEqual([1, 2, 3, 4, 0]);
});

test("array: without immutable the array is returned raw and keeps working in place", () => {
  const store = createStore({ list: [3, 1, 2] });
  const ms = rawMetaStore<{ list: number[] }>(store);

  expect(store.list).toBe(ms._$state_.list);

  store.list.push(4);
  expect(ms._$state_.list).toEqual([3, 1, 2, 4]);
});

test("array: a held array reference is a snapshot, consistent with objects", () => {
  // Objects and arrays must behave the same way here: a reference read through
  // the proxy before a write points at the object that was in the tree at that
  // moment and must not follow later commits. The array branch used to read the
  // live tree unconditionally, which made held arrays track the state while
  // held objects did not.
  const arrStore = createStore<{ tags: string[] }>({ tags: ["a"] }, { immutable: true });
  const heldArray = arrStore.tags;
  arrStore.tags.push("b");
  expect(heldArray).toEqual(["a"]);
  expect(arrStore.tags).toEqual(["a", "b"]);

  const objStore = createStore<{ box: { value: number } }>(
    { box: { value: 1 } },
    { immutable: true },
  );
  const heldObject = objStore.box;
  objStore.box = { value: 2 };
  expect(heldObject).toEqual({ value: 1 });
  expect(objStore.box).toEqual({ value: 2 });
});
