import { expect, test } from "vitest";
import { createStore } from "../../src";
import { rawMetaStore, rawState } from "../__utils__";

/**
 * @description Write-side semantics (task 2.8), mirroring the scenarios of
 * `specs/state-update-semantics`.
 *
 * All assertions are value/reference comparisons rather than `expect(() => …)`,
 * so they fail when the behaviour regresses.
 */

type S = {
  userInfo: { name: string; address: { city: string } };
  other: { keep: number };
};

const build = () =>
  createStore<S>(
    {
      userInfo: { name: "a", address: { city: "bj" } },
      other: { keep: 1 },
    },
    { immutable: true },
  );

test("write-side: the tree that existed before a chained write stays frozen", () => {
  const store = build();
  const before = rawState<S>(store);
  const beforeUserInfo = before.userInfo;

  store.userInfo.name = "b";

  // Scenario: old snapshot frozen.
  expect(beforeUserInfo.name).toBe("a");
  expect(before.userInfo).toBe(beforeUserInfo);
  // The live state did move on.
  expect(rawState<S>(store).userInfo.name).toBe("b");
});

test("write-side: every level on the path gets a new identity", () => {
  const store = createStore<{ a: { b: { c: number } } }>(
    { a: { b: { c: 1 } } },
    { immutable: true },
  );
  const before = rawState<{ a: { b: { c: number } } }>(store);

  store.a.b.c = 2;

  const after = rawState<{ a: { b: { c: number } } }>(store);
  expect(after.a).not.toBe(before.a);
  expect(after.a.b).not.toBe(before.a.b);
  expect(after).not.toBe(before);
  expect(after.a.b.c).toBe(2);
});

test("write-side: branches outside the path keep sharing their reference", () => {
  const store = build();
  const before = rawState<S>(store);

  store.userInfo.name = "b";

  const after = rawState<S>(store);
  // Scenario: sibling branch keeps identity.
  expect(after.other).toBe(before.other);
  // Scenario: untouched sibling field inside the copied host keeps identity.
  expect(after.userInfo.address).toBe(before.userInfo.address);
});

test("write-side: an equal value produces no new references and no notification", async () => {
  const store = build();
  const ms = rawMetaStore<S>(store);
  const before = ms._$state_;

  let notified = 0;
  store.subscribe(() => { notified++; });

  // Same value at every level.
  store.userInfo.name = "a";
  store.userInfo.address.city = "bj";

  await new Promise((resolve) => setTimeout(resolve, 20));

  expect(ms._$state_).toBe(before);
  expect(ms._$state_.userInfo).toBe(before.userInfo);
  expect(notified).toBe(0);
});

test("write-side: a changed value notifies exactly once per batch", async () => {
  const store = build();
  const ms = rawMetaStore<S>(store);

  const effectStates: unknown[] = [];
  store.subscribe(({ effectState }) => { effectStates.push(effectState); });

  store.userInfo.name = "b";
  store.userInfo.address.city = "sh";

  await new Promise((resolve) => setTimeout(resolve, 20));

  expect(effectStates.length).toBe(1);
  expect(ms._$state_.userInfo.name).toBe("b");
  expect(ms._$state_.userInfo.address.city).toBe("sh");
});

test("write-side: prevState is the tree from before the batch", async () => {
  const store = createStore<{ userInfo: { name: string; age: number } }>(
    { userInfo: { name: "a", age: 1 } },
    { immutable: true },
  );

  let captured: { prev: any; next: any } | null = null;
  store.subscribe(({ prevState, nextState }) => {
    captured = { prev: prevState, next: nextState };
  });

  store.userInfo.name = "b";
  store.userInfo.age = 20;

  await new Promise((resolve) => setTimeout(resolve, 20));

  // Scenario: prevState reflects the value before the batch's writes.
  expect(captured).not.toBeNull();
  expect(captured!.prev.userInfo.name).toBe("a");
  expect(captured!.prev.userInfo.age).toBe(1);
  expect(captured!.next.userInfo.name).toBe("b");
  expect(captured!.next.userInfo.age).toBe(20);
});

test("write-side: deleting a nested key keeps the old snapshot intact", () => {
  const store = createStore<{ userInfo: { name?: string; age: number } }>(
    { userInfo: { name: "a", age: 1 } },
    { immutable: true },
  );
  const before = rawState<{ userInfo: { name?: string; age: number } }>(store);

  delete store.userInfo.name;

  const after = rawState<{ userInfo: { name?: string; age: number } }>(store);
  expect(Object.prototype.hasOwnProperty.call(after.userInfo, "name")).toBe(false);
  expect(after.userInfo.age).toBe(1);
  expect(before.userInfo.name).toBe("a");
});

test("write-side: setState also keeps the previous tree frozen", () => {
  const store = build();
  const before = rawState<S>(store);

  store.setState({ userInfo: { name: "z", address: { city: "gz" } } } as any);

  const after = rawState<S>(store);
  expect(after.userInfo.name).toBe("z");
  expect(after).not.toBe(before);
  // The old tree is untouched.
  expect(before.userInfo.name).toBe("a");
  expect(after.other).toBe(before.other);
});

/* ------------------------------------------------------------------ *
 * Leaf-node boundaries (task 2.9) — spec: "链式写入仅对纯对象与数组生效"
 * ------------------------------------------------------------------ */

test("leaf: replacing a Date as a whole takes effect and replaces references", () => {
  const original = new Date(0);
  const replacement = new Date(2020, 0, 1);
  const store = createStore<{ when: Date; other: { keep: number } }>(
    { when: original, other: { keep: 1 } },
    { immutable: true },
  );
  const before = rawState<{ when: Date; other: { keep: number } }>(store);

  store.when = replacement;

  const after = rawState<{ when: Date; other: { keep: number } }>(store);
  expect(after.when).toBe(replacement);
  expect(after).not.toBe(before);
  // Path-external branch keeps identity.
  expect(after.other).toBe(before.other);
});

test("leaf: mutating a Date in place produces no update and is visible in the old snapshot", async () => {
  const when = new Date(0);
  const store = createStore<{ when: Date }>({ when }, { immutable: true });
  const ms = rawMetaStore<{ when: Date }>(store);
  const before = ms._$state_;

  let notified = 0;
  store.subscribe(() => { notified++; });

  // `Date` is a leaf, so its own mutator is not intercepted.
  store.when.setFullYear(2021);

  await new Promise((resolve) => setTimeout(resolve, 20));

  // No new state tree and no update …
  expect(ms._$state_).toBe(before);
  expect(notified).toBe(0);
  // … and the mutation is visible wherever the reference is held, including
  // the snapshot taken before it. This is the documented cost of the leaf rule.
  expect(before.when.getFullYear()).toBe(2021);
});

test("leaf: a non-proxyable built-in is returned raw, so its writes bypass state", () => {
  const when = new Date(0);
  const store = createStore<{ when: Date }>({ when }, { immutable: true });
  const ms = rawMetaStore<{ when: Date }>(store);
  const before = ms._$state_;

  // `proxyable(new Date()) === false`, so `store.when` is the raw object.
  expect(store.when).toBe(when);

  (store.when as any).anyKey = 1;

  // No state tree change and no update …
  expect(ms._$state_).toBe(before);
  // … but there is also no interception: the raw object really was extended and
  // every holder of that reference sees it. See the paused task for the
  // contract gap this reveals.
  expect(Object.prototype.hasOwnProperty.call(when, "anyKey")).toBe(true);
});

test("leaf: array elements can be written through", () => {
  const store = createStore<{ list: { id: number }[]; other: { keep: number } }>(
    { list: [{ id: 1 }, { id: 2 }], other: { keep: 1 } },
    { immutable: true },
  );
  const before = rawState<{ list: { id: number }[]; other: { keep: number } }>(store);
  const beforeList = before.list;
  const beforeFirst = before.list[0];

  store.list[1].id = 99;

  const after = rawState<{ list: { id: number }[]; other: { keep: number } }>(store);
  expect(after.list[1].id).toBe(99);
  // The array and the path levels are new …
  expect(after.list).not.toBe(beforeList);
  expect(after).not.toBe(before);
  // … while the untouched element keeps its identity.
  expect(after.list[0]).toBe(beforeFirst);
  // … and the old snapshot keeps its own value.
  expect(beforeList[1].id).toBe(2);
});

test("leaf: writes into a non-penetrable host are reported, not dropped", () => {
  class Box {
    constructor(public value: number) {}
    bump() { this.value++; }
  }

  const box = new Box(1);
  const store = createStore<{ box: Box }>({ box }, { immutable: true });
  const ms = rawMetaStore<{ box: Box }>(store);
  const before = ms._$state_;

  // Unlike a `Date`, a class instance IS considered proxyable, so a wrapper is
  // created around it …
  expect(store.box).not.toBe(box);

  // … but it is not penetrable, so committing through it is impossible. The
  // contract under test is that this is *reported* rather than dropped in
  // silence. The wording is deliberately not pinned here: this path is only
  // reachable for types the library does not model, and asserting its text would
  // turn a diagnostic message into a stable API.
  expect(() => store.box.bump()).toThrowError(/updateMetaState/);

  // Nothing was written anywhere: no tree change, and the raw instance keeps
  // its own value because the mutation never reached it.
  expect(ms._$state_).toBe(before);
  expect(before.box.value).toBe(1);
});

test("leaf: writing into a Map member is reported with the path and the type", () => {
  const store = createStore<{ m: Map<string, number> }>(
    { m: new Map([["k", 1]]) },
    { immutable: true },
  );

  // `Map` reaches the same guard and IS a type the library models, so here the
  // diagnostic content is worth pinning.
  expect(() => { (store.m as any).foo = 1; }).toThrowError(
    /write path "m\.foo" to be a plain object or an array, Instead received: map/,
  );
});

