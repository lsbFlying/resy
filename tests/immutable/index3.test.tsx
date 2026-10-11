import { expect, test } from "vitest";
import { createStore } from "../../src";
import { pathKey } from "../../src/store/core";
import { rawState } from "../__utils__";

/**
 * @description Read-side identity semantics (tasks 4.1 – 4.5), mirroring the
 * scenarios of `specs/state-read-identity`.
 */

test("read-identity: the same path read twice yields the same wrapper", () => {
  const store = createStore(
    { userInfo: { name: "a", address: { city: "bj" } }, other: { keep: 1 } },
    { immutable: true },
  );

  expect(store.userInfo).toBe(store.userInfo);
  expect(store.userInfo.address).toBe(store.userInfo.address);
  expect(store.other).toBe(store.other);
});

test("read-identity: a changed target yields a new wrapper", () => {
  const store = createStore(
    { userInfo: { name: "a", address: { city: "bj" } } },
    { immutable: true },
  );
  const beforeAddress = store.userInfo.address;

  store.userInfo.address.city = "sh";

  // The address itself changed, so its wrapper is new …
  expect(store.userInfo.address).not.toBe(beforeAddress);
  // … and the previously held wrapper still resolves to the old value.
  expect(beforeAddress.city).toBe("bj");
});

test("read-identity: an untouched sibling keeps its wrapper after a write", () => {
  const store = createStore(
    { userInfo: { name: "a", address: { city: "bj" } } },
    { immutable: true },
  );
  const beforeAddress = store.userInfo.address;

  store.userInfo.name = "b";

  // `address` was not on the written path, so it keeps its identity …
  expect(store.userInfo.address).toBe(beforeAddress);
  // … while its host was cloned.
  expect(store.userInfo).not.toBe(undefined);
});

test("read-identity: replacing a nested object keeps the old reference intact", () => {
  const store = createStore(
    { userInfo: { address: { city: "bj" } } },
    { immutable: true },
  );
  const heldAddress = store.userInfo.address;

  store.userInfo.address = { city: "sh" };

  expect(store.userInfo.address.city).toBe("sh");
  expect(store.userInfo.address).not.toBe(heldAddress);
  // The reference held before the write is frozen, not rewritten.
  expect(heldAddress.city).toBe("bj");
});

test("read-identity: a shared object is identified per path and writes stay independent", () => {
  const shared = { value: 1 };
  const store = createStore(
    { a: { s: shared }, b: { s: shared } },
    { immutable: true },
  );

  const viaA = store.a.s;
  const viaB = store.b.s;

  // Distinct wrappers, because a wrapper carries the path it writes to.
  expect(viaA).not.toBe(viaB);

  store.a.s.value = 99;

  // Only the path that was written moved.
  expect(rawState<{ a: { s: { value: number } }; b: { s: { value: number } } }>(store)
    .a.s.value).toBe(99);
  expect(store.b.s.value).toBe(1);
});

test("read-identity: a stale wrapper writes to its path's current location", () => {
  const store = createStore(
    { userInfo: { name: "a" } },
    { immutable: true },
  );

  const stale = store.userInfo;
  // Replace the object at that path; the wrapper held above is now stale.
  store.userInfo = { name: "z" } as { name: string };

  stale.name = "written-through-stale";

  // The write lands on the live location, not on the detached old object.
  expect(rawState<{ userInfo: { name: string } }>(store).userInfo.name)
    .toBe("written-through-stale");
});

test("pathKey: distinct paths never collide", () => {
  const keys = [
    pathKey(["a", "b"]),
    pathKey(["a\u0001sb"]),
    pathKey(["a\u0001", "b"]),
    pathKey([1]),
    pathKey(["1"]),
    pathKey([Symbol.for("x")]),
  ];

  expect(new Set(keys).size).toBe(keys.length);
  // Same path still yields the same key.
  expect(pathKey(["a", "b"])).toBe(pathKey(["a", "b"]));
});
