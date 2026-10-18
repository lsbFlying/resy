import { inspect } from "node:util";
import { expect, test } from "vitest";
import { createStore } from "../../src";
import { rawMetaStore, rawState } from "../__utils__";

/**
 * @description Wrappers must never reach the state tree (task 8.6, D15).
 *
 * Array methods, `ResyMap.set` and `ResySet.add` already normalize their
 * arguments; the public write entry points (`updateMetaState` / `setState`)
 * used to skip that step, so assigning a proxy/handle stored the wrapper
 * itself. These cases pin the normalization contract.
 */

type State = {
  a: { n: number };
  user: { name: string; address: { city: string } };
  list: { id: number }[];
  src: { id: number }[];
  m: Map<string, number>;
  b?: unknown;
  copy?: unknown;
  alias?: unknown;
};

const build = () => createStore<State>({
  a: { n: 1 },
  user: { name: "a", address: { city: "bj" } },
  list: [{ id: 1 }],
  src: [{ id: 9 }],
  m: new Map([["k", 1]]),
}, { immutable: true });

const flush = () => new Promise<void>(resolve => { setTimeout(resolve, 0); });

const isProxy = (value: unknown) =>
  inspect(value, { showProxy: true, depth: 6 }).includes("Proxy");

test("write-entry: assigning a handle aliases the raw object", () => {
  const store = build();

  (store as any).b = store.a;

  expect(rawState<State>(store).b).toBe(rawState<State>(store).a);
  expect(isProxy(rawState<State>(store).b)).toBe(false);
});

test("write-entry: self assignment is a no-op", async () => {
  const store = build();
  const before = rawMetaStore<State>(store)._$state_;
  let calls = 0;
  store.subscribe(() => { calls++; });

  (store as any).user = store.user;
  await flush();

  expect(rawMetaStore<State>(store)._$state_).toBe(before);
  expect(isProxy(rawState<State>(store).user)).toBe(false);
  expect(calls).toBe(0);
});

test("write-entry: setState normalizes nested handles", () => {
  const store = build();
  const address = store.user.address;

  store.setState({ b: { addr: address } } as any);

  expect((rawState<State>(store) as any).b.addr).toBe(rawState<State>(store).user.address);
  expect(isProxy((rawState<State>(store) as any).b.addr)).toBe(false);
});

test("write-entry: spreading a handle keeps its nested values raw", () => {
  const store = build();
  const address = rawState<State>(store).user.address;

  (store as any).user = { ...(store.user as any), name: "b" };

  expect(rawState<State>(store).user.name).toBe("b");
  expect(rawState<State>(store).user.address).toBe(address);
  expect(isProxy(rawState<State>(store).user.address)).toBe(false);
});

test("write-entry: an array element assigned a handle stores the raw element", () => {
  const store = build();

  (store as any).list[0] = (store as any).src[0];

  expect(rawState<State>(store).list[0]).toBe(rawState<State>(store).src[0]);
  expect(isProxy(rawState<State>(store).list[0])).toBe(false);
});

test("write-entry: a container handle assigned to a key stores the raw Map", () => {
  const store = build();

  (store as any).copy = store.m;

  const copy = rawState<State>(store).copy as Map<string, number>;
  expect(copy).toBeInstanceOf(Map);
  expect(copy.constructor).toBe(Map);
  expect(copy.get("k")).toBe(1);
});

test("write-entry: a sequence of common idioms leaves no wrapper in the state", () => {
  const store = build();

  (store as any).alias = store.a;
  (store as any).user = { ...(store.user as any), name: "b" };
  (store as any).list[0] = (store as any).src[0];
  (store as any).copy = store.m;
  store.setState({ b: { addr: (store as any).a } } as any);

  expect(inspect(rawState<State>(store), { showProxy: true, depth: 8 })).not.toContain("Proxy");
});
