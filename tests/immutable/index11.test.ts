import { expect, test, vi } from "vitest";
import { createStore } from "../../src";
import { rawMetaStore, rawState } from "../__utils__";

// Detached writes are reported once per path in development; keep the expected
// diagnostics out of the test output.
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

/**
 * @description Writes through detached element handles.
 *
 * Once an element is no longer part of the current state tree, a handle that
 * still points at it must behave as a harmless snapshot: reads keep working,
 * writes change nothing, and nothing is scheduled or notified. The element as
 * an independent object is the raw value (returned by pop/shift/splice or read
 * from the raw state), which stays mutable without touching the store.
 */

type Person = { id: number; name?: string };
type State = {
  user: { name: string; address: { city: string } };
  list: Person[];
  m: Map<string, Person>;
  st: Set<Person>;
};

const build = () => createStore<State>({
  user: { name: "a", address: { city: "bj" } },
  list: [{ id: 1 }, { id: 2 }, { id: 3 }],
  m: new Map([["one", { id: 1, name: "one" }]]),
  st: new Set([{ id: 1, name: "s" }]),
}, { immutable: true });

const flush = () => new Promise<void>(resolve => { setTimeout(resolve, 0); });

const track = (store: unknown) => {
  let calls = 0;
  (store as any).subscribe(() => { calls++; });
  return {
    count: () => calls,
    reset: () => { calls = 0; },
  };
};

const ids = (store: unknown) =>
  rawState<State>(store).list.map(item => item.id);

test("detached: writing a removed object element changes nothing", async () => {
  const store = build();
  const notify = track(store);
  const user = store.user as any;

  delete (store as any).user;
  await flush();
  const rootAfterRemoval = rawMetaStore<State>(store)._$state_;
  notify.reset();

  warnSpy.mockClear();
  expect(() => { user.name = "detached"; }).not.toThrow();
  await flush();

  expect(warnSpy).toHaveBeenCalledTimes(1);
  expect(rawMetaStore<State>(store)._$state_).toBe(rootAfterRemoval);
  expect(rawState<State>(store).user).toBeUndefined();
  expect(notify.count()).toBe(0);
});

test("detached: writing a replaced object path does not touch the new object", async () => {
  const store = build();
  const notify = track(store);
  const oldUser = store.user as any;

  (store as any).user = { name: "new", address: { city: "xz" } };
  await flush();
  notify.reset();

  oldUser.name = "zombie";
  await flush();

  expect(rawState<State>(store).user.name).toBe("new");
  expect(notify.count()).toBe(0);
});

test("detached: shift leaves the removed element handle inert", async () => {
  const store = build();
  const notify = track(store);
  const first = store.list[0];

  store.list.shift();
  await flush();
  notify.reset();

  (first as any).id = 99;
  await flush();

  expect(ids(store)).toEqual([2, 3]);
  expect(notify.count()).toBe(0);
});

test("detached: splice leaves the removed element handle inert", () => {
  const store = build();
  const first = store.list[0];

  store.list.splice(0, 1);
  (first as any).id = 99;

  expect(ids(store)).toEqual([2, 3]);
});

test("detached: pop leaves the removed element handle inert", () => {
  const store = build();
  const last = store.list[2];

  store.list.pop();
  (last as any).id = 99;

  expect(ids(store)).toEqual([1, 2]);
});

test("detached: a replaced array element cannot write into its successor", () => {
  const store = build();
  const first = store.list[0];

  (store as any).list[0] = { id: 8, name: "new" };
  (first as any).id = 7;

  expect(ids(store)).toEqual([8, 2, 3]);
});

test("detached: a held array handle is inert after the whole array is replaced", async () => {
  const store = build();
  const notify = track(store);
  const list = store.list as any;

  (store as any).list = [{ id: 9, name: "n" }];
  await flush();
  notify.reset();

  expect(() => { list.push({ id: 10, name: "x" }); }).not.toThrow();
  await flush();

  expect(ids(store)).toEqual([9]);
  expect(notify.count()).toBe(0);
});

test("detached: a deleted Map member handle is inert", async () => {
  const store = build();
  const notify = track(store);
  const member = store.m.get("one")!;

  store.m.delete("one");
  await flush();
  notify.reset();

  member.name = "zombie";
  await flush();

  expect(rawState<State>(store).m.size).toBe(0);
  expect(notify.count()).toBe(0);
});

test("detached: a replacement Map member does not receive writes from the old handle", () => {
  const store = build();
  const member = store.m.get("one")!;

  store.m.set("one", { id: 2, name: "new" });
  member.name = "zombie";

  expect(rawState<State>(store).m.get("one")!.name).toBe("new");
});

test("detached: a deleted Set member handle is inert", async () => {
  const store = build();
  const notify = track(store);
  const member = [...(store.st as any)][0];

  store.st.delete(member);
  await flush();
  notify.reset();

  member.name = "zombie";
  await flush();

  expect(rawState<State>(store).st.size).toBe(0);
  expect(notify.count()).toBe(0);
});

test("detached: an element moved to another index is not relocated by identity", () => {
  const store = build();
  const first = store.list[0];
  const rawFirst = rawState<State>(store).list[0];

  store.list.shift();
  store.list.push(rawFirst);
  (first as any).id = 99;

  // The same raw object is still in the tree at a different index, but the
  // handle is position-based and stays detached.
  expect(ids(store)).toEqual([2, 3, 1]);
});

test("detached: a detached write schedules no batch", async () => {
  const store = build();
  const first = store.list[0];

  store.list.shift();
  await flush();

  (first as any).id = 99;
  await flush();

  expect(rawMetaStore<State>(store)._scheduler_.taskData).toEqual({});
});

test("detached: the raw removed object stays mutable without touching the store", async () => {
  const store = build();
  const notify = track(store);
  const raw = rawState<State>(store).list[0];

  store.list.shift();
  await flush();
  notify.reset();

  raw.name = "independent";

  expect(raw.name).toBe("independent");
  expect(ids(store)).toEqual([2, 3]);
  expect(notify.count()).toBe(0);
});

test("detached: re-adding the same object at the original index revives the handle", () => {
  const store = build();
  const first = store.list[0];
  const rawFirst = rawState<State>(store).list[0];

  (store as any).list[0] = { id: 7, name: "other" };
  (store as any).list[0] = rawFirst;
  (first as any).id = 55;

  expect(ids(store)).toEqual([55, 2, 3]);
});
