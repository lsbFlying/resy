import { expect, test } from "vitest";
import { createStore } from "../../src";
import { commitPath, readAtPath } from "../../src/immutable/utils";
import { rawState } from "../__utils__";

/**
 * @description Path model tests.
 *
 * The old representation was a `Set<{ key }>`, which de-duplicates equal keys.
 * A path such as `{ x: { x: { x: 1 } } }` therefore collapsed to a single
 * element and the commit landed on the wrong level. An ordered array keeps all
 * three segments, including repeated ones.
 */

test("immutable-path: commitPath keeps every segment of a repeated-key path", () => {
  const root = { x: { x: { x: 1 } } } as Record<string, unknown>;

  const result = commitPath(root, ["x", "x", "x"], 42);
  expect(result.committed).toBe(true);
  const next = (result as { committed: true; root: typeof root }).root;

  // The value lands at the deepest level.
  expect((next.x as any).x.x).toBe(42);

  // Repeated keys must not collapse: every level on the path is a new object.
  expect(next).not.toBe(root);
  expect(next.x).not.toBe(root.x);
  expect((next.x as any).x).not.toBe((root.x as any).x);

  // The tree that existed before the commit stays frozen.
  expect((root.x as any).x.x).toBe(1);
});

test("immutable-path: readAtPath walks repeated keys in order", () => {
  const root = { x: { x: { x: 7 } } };
  expect(readAtPath(root, ["x", "x", "x"])).toBe(7);

  // A path through a leaf returns undefined instead of throwing.
  const withDate = { when: new Date(0) } as Record<string, unknown>;
  expect(readAtPath(withDate, ["when", "x"])).toBeUndefined();
});

test("immutable-path: store write through a three-level repeated-key path", () => {
  const store = createStore({ x: { x: { x: 1 } } }, { immutable: true });

  store.x.x.x = 42;

  // Reading back through the proxy reflects the write …
  expect(store.x.x.x).toBe(42);
  // … and the raw root agrees, which only holds when the path resolved fully.
  expect((rawState<{ x: { x: { x: number } } }>(store).x as any).x.x).toBe(42);
});

test("immutable-path: a level-one path is honoured as such", () => {
  const root = { count: 1, other: { count: 2 } };

  const result = commitPath(root, ["count"], 5);
  expect(result.committed).toBe(true);
  const next = (result as { committed: true; root: typeof root }).root;

  expect(next.count).toBe(5);
  // The nested `count` is a different location and must not be touched.
  expect(next.other.count).toBe(2);
  expect(next.other).toBe(root.other);
});
