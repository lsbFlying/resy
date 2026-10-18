import { expect, test, vi } from "vitest";
import { createStore } from "../../src";
import { rawState } from "../__utils__";

// Detached writes are reported in development; this file asserts behaviour.
vi.spyOn(console, "warn").mockImplementation(() => {});

/**
 * @description Destructuring then updating (tasks 8.2, `state-update-semantics`
 * 「活跃句柄必须保持可写」与「已脱离状态树的元素写入必须无效」).
 *
 * A destructured handle is a path view, not a copy: it must keep writing while
 * the path still denotes the object it was created from (including clones this
 * store produced for its own writes), and must become inert once the path is
 * replaced by an unrelated object.
 */

type User = { name: string; address?: { city: string } };
type State = {
  user: User;
  other: { keep: number };
  list: { id: number }[];
  src: { id: number }[];
};

const build = () => createStore<State>({
  user: { name: "a", address: { city: "bj" } },
  other: { keep: 1 },
  list: [{ id: 1 }],
  src: [{ id: 9 }],
}, { immutable: true });

test("destructure: a destructured handle keeps writing across its own commits", () => {
  const store = build();
  const beforeOther = rawState<State>(store).other;
  const { user } = store as any;

  user.name = "b";
  user.name = "c";

  expect(rawState<State>(store).user.name).toBe("c");
  // The untouched sibling still shares its reference.
  expect(rawState<State>(store).other).toBe(beforeOther);
});

test("destructure: a parent handle survives a write through its child", () => {
  const store = build();
  const user = store.user as any;

  user.address.city = "sh";
  // The child write cloned `user` itself; the held parent handle must follow.
  user.name = "b";

  expect(rawState<State>(store).user).toEqual({ name: "b", address: { city: "sh" } });
});

test("destructure: nested destructuring writes through", () => {
  const store = build();
  const { user } = store as any;
  const { address } = user;

  address.city = "sh";

  expect(rawState<State>(store).user.address!.city).toBe("sh");
});

test("destructure: an array element handle writes through", () => {
  const store = build();
  const [first] = store.list as any;

  first.id = 42;

  expect(rawState<State>(store).list[0].id).toBe(42);
});

test("destructure: a replaced path detaches the old handle", () => {
  const store = build();
  const user = store.user as any;

  (store as any).user = { name: "new", address: { city: "xz" } };
  user.name = "zombie";

  expect(rawState<State>(store).user.name).toBe("new");
  expect(rawState<State>(store).user.address!.city).toBe("xz");
});

test("destructure: re-reading after a replacement yields the new object", () => {
  const store = build();
  const before = store.user;

  (store as any).user = { name: "new", address: { city: "xz" } };

  expect(store.user).not.toBe(before);
  expect(store.user.name).toBe("new");
  // The old reference is frozen, not rewritten.
  expect(before.name).toBe("a");
});

test("destructure: a held array handle keeps mutating", () => {
  const store = build();
  const { list } = store as any;

  list.push({ id: 2 });
  list.push({ id: 3 });

  expect(rawState<State>(store).list.map(item => item.id)).toEqual([1, 2, 3]);
});

test("destructure: deleting through a live handle works", () => {
  const store = build();
  const user = store.user as any;

  delete user.address;

  expect("address" in rawState<State>(store).user).toBe(false);
  expect(rawState<State>(store).user.name).toBe("a");
});
