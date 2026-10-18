import { expect, test } from "vitest";
import { waitFor } from "@testing-library/react";
import { createStore } from "../../src";
import { rawState } from "../__utils__";

/**
 * @description `prevState` semantics.
 *
 * `prevState` is published as a reference to the root that existed before the
 * batch. Because every commit is copy-on-write, that tree is never written to
 * again, so the reference stays a true historical snapshot — including across
 * later batches and across nested writes.
 *
 * Waits poll the subscriber payload rather than sleeping for a fixed delay, so a
 * failure reports the state that never arrived instead of a bare timeout.
 */

test("prevState: the captured snapshot survives later batches", async () => {
  const store = createStore(
    { userInfo: { name: "a", age: 1 } },
    { immutable: true },
  );

  const snapshots: Array<{ prev: any; next: any }> = [];
  store.subscribe(({ prevState, nextState }) => {
    snapshots.push({ prev: prevState, next: nextState });
  });

  // Batch 1
  store.userInfo.name = "b";
  await waitFor(() => expect(snapshots.length).toBe(1));

  // Batch 2 — must not rewrite the snapshot published by batch 1.
  store.userInfo.name = "c";
  store.userInfo.age = 30;
  await waitFor(() => expect(snapshots.length).toBe(2));

  // Batch 1 payload.
  expect(snapshots[0].prev.userInfo.name).toBe("a");
  expect(snapshots[0].prev.userInfo.age).toBe(1);
  expect(snapshots[0].next.userInfo.name).toBe("b");

  // Batch 2 payload.
  expect(snapshots[1].prev.userInfo.name).toBe("b");
  expect(snapshots[1].prev.userInfo.age).toBe(1);
  expect(snapshots[1].next.userInfo.name).toBe("c");
  expect(snapshots[1].next.userInfo.age).toBe(30);

  // Re-reading the first snapshot afterwards still yields the historical value.
  expect(snapshots[0].prev.userInfo.name).toBe("a");
  expect(snapshots[0].prev.userInfo.age).toBe(1);
});

test("prevState: a nested write does not rewrite an already published snapshot", async () => {
  const store = createStore(
    { userInfo: { address: { city: "bj" } } },
    { immutable: true },
  );

  let firstPrev: any = null;
  store.subscribe(({ prevState }) => {
    if (firstPrev === null) firstPrev = prevState;
  });

  store.userInfo.address.city = "sh";

  await waitFor(() => expect(firstPrev).not.toBeNull());

  // The snapshot from before the write still shows the old nested value, which
  // is exactly what the old shallow copy failed to guarantee.
  expect(firstPrev.userInfo.address.city).toBe("bj");

  // And the live state moved on.
  expect(rawState<{ userInfo: { address: { city: string } } }>(store)
    .userInfo.address.city).toBe("sh");
});

test("prevState: setState and chained writes share one batch snapshot", async () => {
  const store = createStore(
    { count: 0, text: "hello" },
    { immutable: true },
  );

  let payload: { prev: any; next: any } | undefined;
  store.subscribe(({ prevState, nextState }) => {
    payload = { prev: prevState, next: nextState };
  });

  store.count = 1;
  store.setState({ text: "world" });

  await waitFor(() => expect(payload).toBeDefined());

  expect(payload!.prev.count).toBe(0);
  expect(payload!.prev.text).toBe("hello");
  expect(payload!.next.count).toBe(1);
  expect(payload!.next.text).toBe("world");
});
