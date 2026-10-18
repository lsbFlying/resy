import { expect, test } from "vitest";
import { createStore } from "../../src";
import { rawState } from "../__utils__";

test("childCache: a snapshot proxy reuses its children; a clone gets a new parent", () => {
  const store = createStore(
    { user: { name: "a", address: { city: "bj" } }, other: { keep: 1 } },
    { immutable: true },
  );

  const user = store.user;
  const address = user.address;
  expect(store.user).toBe(user);
  expect(user.address).toBe(address);

  store.user.name = "b";

  // The clone replaces the parent snapshot, so the new read is a new proxy …
  expect(store.user).not.toBe(user);
  // … but the untouched child still shares its identity.
  expect(store.user.address).toBe(address);
  // The old parent/child pair remains a frozen snapshot.
  expect(user.name).toBe("a");
  expect(user.address).toBe(address);
});

test("childCache: a changed child creates a new child on the new parent", () => {
  const store = createStore(
    { user: { name: "a", address: { city: "bj" } } },
    { immutable: true },
  );

  const beforeUser = store.user;
  const beforeAddress = beforeUser.address;

  store.user.address.city = "sh";

  expect(store.user).not.toBe(beforeUser);
  expect(store.user.address).not.toBe(beforeAddress);
  expect(store.user.address.city).toBe("sh");
  expect(beforeAddress.city).toBe("bj");
});

test("childCache: the root keeps reading the latest child after a commit", () => {
  const store = createStore(
    { user: { name: "a" }, other: { keep: 1 } },
    { immutable: true },
  );

  const before = store.user;
  store.user = { name: "new" };

  expect(store.user).not.toBe(before);
  expect(store.user.name).toBe("new");
  expect(rawState<{ user: { name: string } }>(store).user.name).toBe("new");
});

test("childCache: Map member identity is unchanged by another member write", () => {
  const store = createStore(
    { m: new Map<string, { id: number }>([["a", { id: 1 }], ["b", { id: 2 }]]) },
    { immutable: true },
  );

  const member = store.m.get("a");
  expect(store.m.get("a")).toBe(member);

  store.m.set("b", { id: 3 });

  expect(store.m.get("a")).toBe(member);
  expect(store.m.get("a")!.id).toBe(1);
});
