import { expect, test } from "vitest";
import { createStore } from "../../src";
import { rawState } from "../__utils__";

/**
 * @description `Map` / `Set` operations under `immutable: true`.
 *
 * These were completely broken before this change. The failure modes were:
 * `Map.get`/`Map.set` threw `parentTarget.get is not a function`,
 * `Map.has`/`Set.has`/`Map.keys` threw `incompatible receiver`, and
 * `delete`/`clear` overwrote the container with the changed member, turning
 * `{ m: new Map() }` into `{ m: 2 }`.
 *
 * Four distinct root causes were fixed:
 * 1. the `apply` trap passed its own `proxy` — the wrapped *method* — as the
 *    factory's `parentTarget` instead of the container;
 * 2. the factory committed twice, the second time writing the member value onto
 *    the container's own path;
 * 3. `has`/`keys` were missing from the router registry and from the
 *    "is a container method" predicate, so they reached the raw built-in and
 *    failed the brand check;
 * 4. `delete`/`clear` called `Map` methods on the container proxy.
 */

type MapState = { m: Map<string, number> };
type SetState = { s: Set<number> };

const mapStore = () => createStore<MapState>(
  { m: new Map([["a", 1], ["b", 2]]) },
  { immutable: true },
);

const setStore = () => createStore<SetState>(
  { s: new Set([1, 2]) },
  { immutable: true },
);

const drain = <T>(iterator: Iterator<T>): T[] => {
  const out: T[] = [];
  let step = iterator.next();
  while (!step.done) {
    out.push(step.value);
    step = iterator.next();
  }
  return out;
};

test("map: read operations return native results", () => {
  const store = mapStore();

  expect(store.m.get("a")).toBe(1);
  expect(store.m.get("missing")).toBeUndefined();
  expect(store.m.has("a")).toBe(true);
  expect(store.m.has("missing")).toBe(false);
  expect(store.m.size).toBe(2);
});

test("map: set commits a new Map and freezes the previous one", () => {
  const store = mapStore();
  const before = rawState<MapState>(store);
  const beforeMap = before.m;

  store.m.set("c", 3);

  const after = rawState<MapState>(store);
  // The container must still be a Map, not the member value.
  expect(after.m).toBeInstanceOf(Map);
  expect(after.m.size).toBe(3);
  expect(after.m.get("c")).toBe(3);
  // Copy-on-write: new references, old snapshot untouched.
  expect(after.m).not.toBe(beforeMap);
  expect(after).not.toBe(before);
  expect(beforeMap.size).toBe(2);
  expect(beforeMap.has("c")).toBe(false);
});

test("map: delete and clear commit a new Map", () => {
  const deleteStore = mapStore();
  const beforeDelete = rawState<MapState>(deleteStore);

  deleteStore.m.delete("a");

  const afterDelete = rawState<MapState>(deleteStore);
  expect(afterDelete.m).toBeInstanceOf(Map);
  expect(afterDelete.m.size).toBe(1);
  expect(afterDelete.m.has("a")).toBe(false);
  expect(beforeDelete.m.size).toBe(2);

  const clearStore = mapStore();
  clearStore.m.clear();
  expect(rawState<MapState>(clearStore).m).toBeInstanceOf(Map);
  expect(rawState<MapState>(clearStore).m.size).toBe(0);
});

test("map: no-op mutations leave the root untouched", () => {
  const store = mapStore();
  const before = rawState<MapState>(store);

  expect(store.m.delete("missing")).toBe(false);
  store.m.clear();
  const afterClear = rawState<MapState>(store);
  expect(afterClear.m.size).toBe(0);

  const second = mapStore();
  const secondBefore = rawState<MapState>(second);
  second.m.set("a", 1);            // same value as the existing entry
  expect(rawState<MapState>(second)).toBe(secondBefore);
  void before;
});

test("map: every iteration helper works through the proxy", () => {
  const store = mapStore();

  const forEachSeen: string[] = [];
  store.m.forEach((value, key) => { forEachSeen.push(`${key}=${value}`); });
  expect(forEachSeen).toEqual(["a=1", "b=2"]);

  expect(drain(store.m.entries())).toEqual([["a", 1], ["b", 2]]);
  expect(drain(store.m.keys())).toEqual(["a", "b"]);
  expect(drain(store.m.values())).toEqual([1, 2]);
});

test("map: a nested Map is addressable and commits on its own path", () => {
  const store = createStore<{ deep: { m: Map<string, number> } }>(
    { deep: { m: new Map([["a", 1]]) } },
    { immutable: true },
  );
  const before = rawState<{ deep: { m: Map<string, number> } }>(store);

  store.deep.m.set("b", 2);

  const after = rawState<{ deep: { m: Map<string, number> } }>(store);
  // Regression guard: the old double commit left `deep` as a Map and
  // `deep.m` as undefined.
  expect(after.deep).not.toBeInstanceOf(Map);
  expect(after.deep.m).toBeInstanceOf(Map);
  expect(after.deep.m.get("b")).toBe(2);
  // Every level on the path is replaced.
  expect(after.deep).not.toBe(before.deep);
  expect(after).not.toBe(before);
  expect(before.deep.m.has("b")).toBe(false);
});

test("set: read operations return native results", () => {
  const store = setStore();

  expect(store.s.has(1)).toBe(true);
  expect(store.s.has(9)).toBe(false);
  expect(store.s.size).toBe(2);
});

test("set: add, delete and clear commit a new Set", () => {
  const addStore = setStore();
  const beforeAdd = rawState<SetState>(addStore);

  addStore.s.add(3);

  const afterAdd = rawState<SetState>(addStore);
  expect(afterAdd.s).toBeInstanceOf(Set);
  expect(afterAdd.s.size).toBe(3);
  expect(afterAdd.s.has(3)).toBe(true);
  expect(afterAdd.s).not.toBe(beforeAdd.s);
  expect(beforeAdd.s.has(3)).toBe(false);

  const deleteStore = setStore();
  deleteStore.s.delete(1);
  expect(rawState<SetState>(deleteStore).s).toBeInstanceOf(Set);
  expect(rawState<SetState>(deleteStore).s.size).toBe(1);

  const clearStore = setStore();
  clearStore.s.clear();
  expect(rawState<SetState>(clearStore).s).toBeInstanceOf(Set);
  expect(rawState<SetState>(clearStore).s.size).toBe(0);
});

test("set: adding an existing value is a no-op", () => {
  const store = setStore();
  const before = rawState<SetState>(store);

  store.s.add(1);

  expect(rawState<SetState>(store)).toBe(before);
});

test("set: every iteration helper works through the proxy", () => {
  const store = setStore();

  const forEachSeen: number[] = [];
  store.s.forEach((value) => { forEachSeen.push(value); });
  expect(forEachSeen).toEqual([1, 2]);

  expect(drain(store.s.keys())).toEqual([1, 2]);
  expect(drain(store.s.values())).toEqual([1, 2]);
  expect(drain(store.s.entries())).toEqual([[1, 1], [2, 2]]);
});

test("set: a nested Set is addressable and commits on its own path", () => {
  const store = createStore<{ deep: { s: Set<number> } }>(
    { deep: { s: new Set([1]) } },
    { immutable: true },
  );
  const before = rawState<{ deep: { s: Set<number> } }>(store);

  store.deep.s.add(2);

  const after = rawState<{ deep: { s: Set<number> } }>(store);
  expect(after.deep).not.toBeInstanceOf(Set);
  expect(after.deep.s).toBeInstanceOf(Set);
  expect(after.deep.s.has(2)).toBe(true);
  expect(after.deep).not.toBe(before.deep);
  expect(before.deep.s.has(2)).toBe(false);
});
