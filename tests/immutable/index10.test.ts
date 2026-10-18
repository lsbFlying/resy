import { expect, test, vi } from "vitest";
import { createStore } from "../../src";

// Detached writes are reported in development; this file asserts behaviour.
vi.spyOn(console, "warn").mockImplementation(() => undefined);
import { rawMetaStore, rawState } from "../__utils__";

/**
 * @description Updating while traversing the state.
 *
 * Callback arguments are path views, so a write through them must commit; the
 * read side of the same view stays a snapshot. Structural changes during the
 * traversal (splice/delete) must not let an element handle write into the
 * element that moved into its slot.
 */

type Person = { id: number; name?: string };

const build = () => createStore<any>({
  user: { name: "a", address: { city: "bj" } },
  list: [{ id: 1 }, { id: 2 }] as Person[],
  m: new Map<string, Person>([["a", { id: 1 }], ["b", { id: 2 }]]),
  st: new Set<Person>([{ id: 1 }, { id: 2 }]),
}, { immutable: true });

const ids = (store: unknown) =>
  rawState<any>(store).list.map((item: Person) => item.id);

test("traversal: forEach writes every element", () => {
  const store = build();

  store.list.forEach((item: Person) => {
    item.id += 10;
  });

  expect(ids(store)).toEqual([11, 12]);
});

test("traversal: for-of writes while the handle read stays a snapshot", () => {
  const store = build();
  const seen: number[] = [];

  for (const item of store.list as any) {
    item.id += 10;
    // Reading through the same handle returns the creation-time value.
    seen.push(item.id);
  }

  expect(ids(store)).toEqual([11, 12]);
  expect(seen).toEqual([1, 2]);
});

test("traversal: read-only callbacks do not commit", () => {
  const store = build();
  const before = rawMetaStore<any>(store)._$state_;

  expect(store.list.map((item: Person) => item.id)).toEqual([1, 2]);
  expect(store.list.filter((item: Person) => item.id > 1)).toHaveLength(1);
  expect(store.list.join("-")).toBe("[object Object]-[object Object]");

  expect(rawMetaStore<any>(store)._$state_).toBe(before);
});

test("traversal: Map.forEach updates a member while deleting another", () => {
  const store = build();

  store.m.forEach((value: Person, key: string) => {
    if (key === "a") store.m.delete(key);
    else value.id += 10;
  });

  const entries = [...(rawState<any>(store).m as Map<string, Person>).entries()];
  expect(entries.map(([key, value]) => [key, value.id])).toEqual([["b", 12]]);
});

test("traversal: Set.forEach updates a member while deleting another", () => {
  const store = build();
  let index = 0;

  store.st.forEach((member: Person) => {
    if (index++ === 0) store.st.delete(member);
    else member.id += 10;
  });

  const members = [...(rawState<any>(store).st as Set<Person>)];
  expect(members.map(member => member.id)).toEqual([12]);
});

test("traversal: an element pushed during forEach is not visited by this pass", () => {
  const store = createStore<any>({ list: [1] }, { immutable: true });
  const visited: number[] = [];

  store.list.forEach((value: number) => {
    visited.push(value);
    if (value === 1) store.list.push(2);
  });

  expect(visited).toEqual([1]);
  expect(rawState<any>(store).list).toEqual([1, 2]);
});

test("traversal: a handle captured before a splice cannot write the element that moved in", () => {
  const store = createStore<any>(
    { list: [{ id: 1 }, { id: 2 }, { id: 3 }] as Person[] },
    { immutable: true },
  );

  store.list.forEach((item: Person, index: number) => {
    if (index === 0) store.list.splice(0, 1);
    else item.id += 100;
  });

  // The second visited item was removed by the splice; the element that moved
  // into its slot must stay at its own value.
  expect(ids(store)).toEqual([2, 3]);
});

test("traversal: Object.entries and Object.values handles are writable", () => {
  const store = build();

  const address = (Object.entries(store.user as any)
    .find(([key]) => key === "address")![1]) as any;
  address.city = "sh";

  const addressFromValues = Object.values(store.user as any)
    .find(value => typeof value === "object") as any;
  addressFromValues.city = "gz";

  expect(rawState<any>(store).user.address.city).toBe("gz");
});

test("traversal: every/filter callback arguments are writable views", () => {
  const store = build();

  const all = store.list.every((item: Person) => {
    item.id += 1;
    return true;
  });

  expect(all).toBe(true);
  expect(ids(store)).toEqual([2, 3]);
});
