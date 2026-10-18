import { expect, test } from "vitest";
import { createStore } from "../../src";

/**
 * The proxy only represents plain data properties. A full data descriptor can
 * be committed; everything copy-on-write cannot represent (accessors, property
 * attributes, prototype changes, extensibility changes) must fail loudly
 * instead of silently mutating the snapshot target.
 */
test("immutable-object: defineProperty commits a full data descriptor", () => {
  const store = createStore({ user: { name: "a" } }, { immutable: true });
  const before = store.user;

  Object.defineProperty(store.user, "name", {
    value: "b",
    writable: true,
    enumerable: true,
    configurable: true,
  });

  expect(store.user.name).toBe("b");
  expect(before.name).toBe("a");
});

test("immutable-object: unsupported descriptor shape is refused", () => {
  const store = createStore({ user: { name: "a" } }, { immutable: true });

  expect(() => {
    Object.defineProperty(store.user, "name", { value: "b" });
  }).toThrow(TypeError);

  expect(store.user.name).toBe("a");
});

test("immutable-object: prototype and extensibility changes are refused", () => {
  const store = createStore({ user: { name: "a" } }, { immutable: true });

  expect(() => {
    Object.setPrototypeOf(store.user, {});
  }).toThrow(TypeError);

  expect(() => {
    Object.preventExtensions(store.user);
  }).toThrow(TypeError);

  expect(store.user.name).toBe("a");
});
