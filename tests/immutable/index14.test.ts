import { inspect } from "node:util";
import { expect, test, vi } from "vitest";
import { createStore } from "../../src";
import { rawMetaStore, rawState } from "../__utils__";

/**
 * @description Regression tests for the review findings (Set lineage, deep
 * wrapper normalization, cross-store wrappers, no-op deletes, detached array
 * reads, null-prototype clones, Map object keys).
 */

vi.spyOn(console, "warn").mockImplementation(() => undefined);

const flush = () => new Promise<void>(resolve => { setTimeout(resolve, 0); });

const noProxy = (value: unknown) =>
  expect(inspect(value, { showProxy: true, depth: 8 })).not.toContain("Proxy");

test("set: consecutive writes through a member handle are all applied", () => {
  const store = createStore<any>(
    { st: new Set([{ id: 1 }]) },
    { immutable: true },
  );
  const member = [...store.st][0] as any;

  member.id = 2;
  member.id = 3;

  expect([...rawState<any>(store).st][0].id).toBe(3);
});

test("set: deeper writes through a member handle keep working", () => {
  const store = createStore<any>(
    { st: new Set([{ id: 1, addr: { city: "a" } }]) },
    { immutable: true },
  );
  const member = [...store.st][0] as any;

  member.addr.city = "b";
  member.addr.city = "c";

  expect([...rawState<any>(store).st][0].addr.city).toBe("c");
});

test("set: a double write inside forEach is not lost", () => {
  const store = createStore<any>(
    { st: new Set([{ id: 1 }]) },
    { immutable: true },
  );

  store.st.forEach((member: any) => {
    member.id = 2;
    member.id = 3;
  });

  // Both writes must land. (`member.id += 1` twice would read the handle's
  // creation snapshot both times, which is the documented read semantics.)
  expect([...rawState<any>(store).st][0].id).toBe(3);
});

test("write-entry: wrappers nested several levels deep are stripped", () => {
  const store = createStore<any>(
    { list: [{ id: 1 }], target: {} as any },
    { immutable: true },
  );
  const kept = { n: 1 };

  store.target = { deep: { item: store.list[0], kept } };

  const state = rawState<any>(store);
  noProxy(state);
  // The wrapper was replaced by the raw element …
  expect(state.target.deep.item).toBe(state.list[0]);
  // … while a wrapper-free subtree keeps its identity.
  expect(state.target.deep.kept).toBe(kept);

  // Writing through a re-read handle follows the new path only.
  const viaRead = store.target.deep.item as any;
  viaRead.id = 9;

  expect(rawState<any>(store).list[0].id).toBe(1);
  expect(rawState<any>(store).target.deep.item.id).toBe(9);
});

test("write-entry: wrappers from another store are unwrapped too", () => {
  const a = createStore<any>(
    { u: { n: 1 }, m: new Map([["k", { n: 1 }]]) },
    { immutable: true },
  );
  const b = createStore<any>(
    { x: {} as any, copy: {} as any },
    { immutable: true },
  );

  b.x = a.u;
  b.copy = a.m;

  expect(rawState<any>(b).x).toBe(rawState<any>(a).u);
  noProxy(rawState<any>(b).x);
  expect(rawState<any>(b).copy.constructor).toBe(Map);

  b.x.n = 9;
  expect(rawState<any>(b).x.n).toBe(9);
  expect(rawState<any>(a).u.n).toBe(1);

  b.copy.set("z", { n: 2 });
  expect(rawState<any>(b).copy.has("z")).toBe(true);
  expect(rawState<any>(a).m.has("z")).toBe(false);
});

test("update: deleting a missing key is a no-op", async () => {
  const store = createStore<any>(
    { a: 1, list: [1, 2] },
    { immutable: true },
  );
  const before = rawMetaStore<any>(store)._$state_;
  let calls = 0;
  store.subscribe(() => { calls++; });

  delete store.missing;
  delete store.list[9];
  await flush();

  expect(rawMetaStore<any>(store)._$state_).toBe(before);
  expect(calls).toBe(0);
});

test("array: a detached handle keeps read-only methods working on its snapshot", () => {
  const store = createStore<any>({ list: [1, 2, 3] }, { immutable: true });
  const list = store.list as any;

  store.list = [9];

  expect(list.length).toBe(3);
  expect(list.join("-")).toBe("1-2-3");
  expect(list.slice(1)).toEqual([2, 3]);
  expect(list.map((value: number) => value * 2)).toEqual([2, 4, 6]);
  expect([...list]).toEqual([1, 2, 3]);

  // Mutating methods stay inert.
  list.push(4);
  expect(rawState<any>(store).list).toEqual([9]);
});

test("immutable: a null-prototype object keeps its prototype across writes", () => {
  const bare = Object.create(null) as { n: number };
  bare.n = 1;
  const store = createStore<any>({ u: bare }, { immutable: true });

  store.u.n = 2;

  expect(Object.getPrototypeOf(rawState<any>(store).u)).toBeNull();
  expect(rawState<any>(store).u.n).toBe(2);
});

test("map: object keys do not share a wrapper path", () => {
  const k1 = { k: 1 };
  const k2 = { k: 2 };
  const shared = { v: 1 };
  const store = createStore<any>(
    { m: new Map<any, any>([[k1, shared], [k2, shared]]) },
    { immutable: true },
  );

  const first = store.m.get(k1) as any;
  const second = store.m.get(k2) as any;
  expect(first).not.toBe(second);

  first.v = 10;

  expect(rawState<any>(store).m.get(k1).v).toBe(10);
  expect(rawState<any>(store).m.get(k2).v).toBe(1);
  expect((store.m.get(k2) as any).v).toBe(1);
});

test("map: setting undefined under a missing key inserts it", () => {
  const store = createStore<any>(
    { m: new Map<string, number | undefined>() },
    { immutable: true },
  );

  store.m.set("k", undefined);

  expect(store.m.has("k")).toBe(true);
  expect(store.m.size).toBe(1);
});

test("set: a whole-set replacement that re-adds the old ref keeps the handle active", () => {
  const store = createStore<any>(
    { st: new Set([{ id: 1 }]) },
    { immutable: true },
  );
  const oldRef = rawState<any>(store).st.values().next().value;
  const member = [...store.st][0] as any;

  member.id = 2;
  store.st = new Set([oldRef]);
  member.id = 3;

  expect([...rawState<any>(store).st][0].id).toBe(3);
});

test("batch: a no-op setState does not leave the willUpdating flag behind", async () => {
  const store = createStore<any>({ count: 0 }, { immutable: true });

  store.setState({ count: 0 });
  await flush();

  expect(rawMetaStore<any>(store)._scheduler_.willUpdating).toBeUndefined();
});

test("frozen values are leaves: reads return the raw value and writes throw natively", () => {
  const element = Object.freeze({ id: 1 });
  const list = Object.freeze([element]);
  const store = createStore<any>({ list }, { immutable: true });

  // No proxy is created for a frozen branch, so reads cannot break the proxy
  // invariant (which would throw a TypeError for the frozen element).
  expect(store.list).toBe(list);
  expect(store.list[0]).toBe(element);
  expect(() => { (store.list[0] as any).id = 2; }).toThrow();
  expect(rawState<any>(store).list).toBe(list);
});

test("map: a handle follows a clone produced through another handle", () => {
  const store = createStore<any>(
    { m: new Map<string, number>() },
    { immutable: true },
  );

  const first = store.m;
  first.set("a", 1);
  const second = store.m;
  second.set("b", 2);
  first.set("c", 3);
  second.set("d", 4);

  expect([...rawState<any>(store).m.entries()])
    .toEqual([["a", 1], ["b", 2], ["c", 3], ["d", 4]]);
});

test("set: a handle follows a clone produced through another handle", () => {
  const store = createStore<any>(
    { st: new Set<number>() },
    { immutable: true },
  );

  const first = store.st;
  first.add(1);
  const second = store.st;
  second.add(2);
  first.add(3);
  second.add(4);

  expect([...rawState<any>(store).st]).toEqual([1, 2, 3, 4]);
});

test("map: a wrapper used as a key is stored as the raw object", () => {
  const store = createStore<any>(
    { list: [{ id: 1 }], m: new Map<any, number>() },
    { immutable: true },
  );
  const key = store.list[0] as any;

  store.m.set(key, 1);

  const rawKey = [...rawState<any>(store).m.keys()][0];
  expect(rawKey).toBe(rawState<any>(store).list[0]);
  expect(store.m.get(key)).toBe(1);
  expect(store.m.has(key)).toBe(true);
  expect(store.m.delete(key)).toBe(true);
});

test("write-entry: Map keys are normalized by the deep pass too", () => {
  const store = createStore<any>(
    { list: [{ id: 1 }], target: {} as any },
    { immutable: true },
  );
  const key = store.list[0];

  store.target = { m: new Map([[key, 1]]) };

  noProxy(rawState<any>(store));
  expect([...rawState<any>(store).target.m.keys()][0]).toBe(rawState<any>(store).list[0]);
});

test("map: distinct symbols with the same description do not share a path", () => {
  const first = Symbol("k");
  const second = Symbol("k");
  const shared = { v: 1 };
  const store = createStore<any>(
    { m: new Map<any, any>([[first, shared], [second, shared]]) },
    { immutable: true },
  );

  const a = store.m.get(first) as any;
  const b = store.m.get(second) as any;
  expect(a).not.toBe(b);

  a.v = 10;

  expect(rawState<any>(store).m.get(first).v).toBe(10);
  expect(rawState<any>(store).m.get(second).v).toBe(1);
});

test("write-entry: a cyclic value containing a wrapper is fully stripped", () => {
  const store = createStore<any>(
    { list: [{ id: 1 }], target: {} as any },
    { immutable: true },
  );
  const node: any = { item: store.list[0] };
  node.self = node;

  store.target = node;

  noProxy(rawState<any>(store));
  expect(rawState<any>(store).target.self).toBe(rawState<any>(store).target);
  expect(rawState<any>(store).target.self.item).toBe(rawState<any>(store).list[0]);
});

test("array: values pushed with a nested wrapper are normalized before commit", () => {
  const store = createStore<any>(
    { list: [{ id: 1 }], target: [] as any[] },
    { immutable: true },
  );
  const item = store.list[0];

  store.list.push({ nested: item });

  noProxy(rawState<any>(store));
  expect(rawState<any>(store).list[1].nested).toBe(rawState<any>(store).list[0]);
});

test("map: a member value with a nested wrapper is normalized before commit", () => {
  const store = createStore<any>(
    { list: [{ id: 1 }], m: new Map<string, any>() },
    { immutable: true },
  );
  const item = store.list[0];

  store.m.set("k", { nested: item });

  noProxy(rawState<any>(store));
  expect(rawState<any>(store).m.get("k").nested).toBe(rawState<any>(store).list[0]);
});

test("set: a member with a nested wrapper is normalized before commit", () => {
  const store = createStore<any>(
    { list: [{ id: 1 }], st: new Set<any>() },
    { immutable: true },
  );
  const item = store.list[0];

  store.st.add({ nested: item });

  noProxy(rawState<any>(store));
  expect([...rawState<any>(store).st][0].nested).toBe(rawState<any>(store).list[0]);
});

test("sealed values are leaves too, so nested reads do not throw", () => {
  const sealed = Object.seal({ nested: { n: 1 } });
  const store = createStore<any>({ u: sealed }, { immutable: true });

  expect(store.u).toBe(sealed);
  expect((store.u as any).nested).toBe(sealed.nested);
});

test("constructor: initial values derived from another store are stored raw", () => {
  const source = createStore<any>({ u: { n: 1 } }, { immutable: true });
  const derived = createStore<any>(
    { direct: source.u, nested: { item: source.u } },
    { immutable: true },
  );

  expect(rawState<any>(derived).direct).toBe(rawState<any>(source).u);
  expect(rawState<any>(derived).nested.item).toBe(rawState<any>(source).u);
  noProxy(rawState<any>(derived));
});

test("write-entry: an own __proto__ property is copied as data", () => {
  const payload = JSON.parse("{\"__proto__\":{\"polluted\":true},\"n\":1}");
  const store = createStore<any>({ u: payload }, { immutable: true });

  store.u.n = 2;

  const state = rawState<any>(store).u;
  expect(Object.getPrototypeOf(state)).toBe(Object.prototype);
  expect(Object.prototype.hasOwnProperty.call(state, "__proto__")).toBe(true);
  expect(({} as any).polluted).toBeUndefined();
  expect(state.n).toBe(2);
});

test("write-entry: writing a __proto__ state key does not change the prototype", () => {
  const store = createStore<any>({ u: { n: 1 } }, { immutable: true });

  (store as any).u.__proto__ = { polluted: true };

  const state = rawState<any>(store).u;
  expect(Object.getPrototypeOf(state)).toBe(Object.prototype);
  expect(Object.prototype.hasOwnProperty.call(state, "__proto__")).toBe(true);
  expect(({} as any).polluted).toBeUndefined();
  expect(state.n).toBe(1);
});

test("restore: initial values derived from another store are normalized", () => {
  const source = createStore<any>({ u: { n: 1 } }, { immutable: true });
  const store = createStore<any>({ x: source.u }, { immutable: true });

  store.x = { n: 2 };
  store.restore();

  expect(rawState<any>(store).x).toBe(rawState<any>(source).u);
  noProxy(rawState<any>(store));
});
