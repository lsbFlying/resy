import { expect, test } from "vitest";
import type { PrimitiveState } from "../../src/types";
import type { CommitResult } from "../../src/immutable/utils";
import { commitPath, readAtPath } from "../../src/immutable/utils";

/**
 * Unwrap a commit result, failing loudly when the commit was refused. The union
 * exists so a caller cannot read a root that was never built.
 */
const appliedRoot = <S extends PrimitiveState>(result: CommitResult<S>): S => {
  if (!result.committed) throw new Error(`expected a commit, got ${result.reason}`);
  return result.root;
};

/** Assert the commit was refused with the given reason. */
const expectRefusal = <S extends PrimitiveState>(
  result: CommitResult<S>,
  reason: "noop" | "leaf",
) => {
  expect(result.committed).toBe(false);
  expect(result.committed === false ? result.reason : null).toBe(reason);
};

/**
 * @description `commitPath` unit tests — the copy-on-write contract.
 *
 * Covers the cases the design enumerates: `path.length === 1`, a no-op write,
 * deleting the final segment, and a path that runs through a non-penetrable
 * leaf. `Map` used to be handled here and is now a leaf as well.
 */

type Root = {
  count: number;
  userInfo: { name: string; address: { city: string } };
  other: { keep: number };
  when: Date;
  list: number[];
};

const buildRoot = (): Root => ({
  count: 0,
  userInfo: { name: "a", address: { city: "bj" } },
  other: { keep: 1 },
  when: new Date(0),
  list: [1, 2, 3],
});

test("commitPath: path.length === 1 writes a first-level key", () => {
  const root = buildRoot();

  const next = appliedRoot(commitPath(root, ["count"], 5));

  expect(next.count).toBe(5);
  expect(next).not.toBe(root);
  // Everything outside the path keeps sharing its reference.
  expect(next.userInfo).toBe(root.userInfo);
  expect(next.other).toBe(root.other);
  // The previous root is untouched.
  expect(root.count).toBe(0);
});

test("commitPath: an equal value returns the same root reference", () => {
  const root = buildRoot();

  // `Object.is` compares the *current* value at the path, so the read has to
  // agree for this to be a genuine no-op.
  expect(readAtPath(root, ["userInfo", "name"])).toBe("a");
  const result = commitPath(root, ["userInfo", "name"], "a");

  expectRefusal(result, "noop");
  expect(result).toEqual({ committed: false, reason: "noop" });
});

test("commitPath: deleting the final key clones the host only", () => {
  const root = buildRoot();

  const next = appliedRoot(commitPath(root, ["userInfo", "name"], undefined, true)) as Record<string, any>;

  expect(Object.prototype.hasOwnProperty.call(next.userInfo, "name")).toBe(false);
  expect(next.userInfo.name).toBeUndefined();
  expect(next.userInfo.address).toEqual({ city: "bj" });
  // The old host object is frozen and still carries the key.
  expect(root.userInfo.name).toBe("a");
});

test("commitPath: a path through a non-penetrable leaf is a no-op", () => {
  const root = buildRoot();

  const result = commitPath(root, ["when", "anyKey"], 123);

  // `Date` is a leaf: the write is refused and the offending host is reported
  // so the caller can name it without walking the path again.
  expectRefusal(result, "leaf");
  expect((result as { host: unknown }).host).toBe(root.when);
});

test("commitPath: nested writes replace every level on the path", () => {
  const root = buildRoot();

  const next = appliedRoot(commitPath(root, ["userInfo", "address", "city"], "sh")) as Root;

  expect(next.userInfo.address.city).toBe("sh");
  expect(next).not.toBe(root);
  expect(next.userInfo).not.toBe(root.userInfo);
  expect(next.userInfo.address).not.toBe(root.userInfo.address);
  // Path-external branches keep identity.
  expect(next.other).toBe(root.other);
  expect(next.list).toBe(root.list);
  // Snapshot safety.
  expect(root.userInfo.address.city).toBe("bj");
});

test("commitPath: arrays are penetrable and cloned with slice", () => {
  const root = buildRoot();

  const next = appliedRoot(commitPath(root, ["list", 1], 99)) as Root;

  expect(next.list[1]).toBe(99);
  expect(next.list).not.toBe(root.list);
  expect(root.list[1]).toBe(2);
});

test("commitPath: a missing intermediate segment is a no-op", () => {
  const root = buildRoot();

  const result = commitPath(root, ["nope", "deeper"], 1);

  // An unresolvable path is an ordinary no-op, not a refusal.
  expectRefusal(result, "noop");
  expect(result).toEqual({ committed: false, reason: "noop" });
});
