import { expect, test } from "vitest";
import { createStore } from "../../src";

const tick = () => new Promise<void>(resolve => { setTimeout(resolve, 0); });

/**
 * `prevBatchState` is only captured before a batch that has listeners. An
 * immediate subscription has no batch of its own, so it must use the current
 * state instead of an undefined or stale captured value.
 */

test("immediate: prevState is defined and equals nextState before any update", () => {
  const store = createStore({ count: 0 }, { immutable: true });

  let received: any;
  const unsubscribe = store.subscribe(params => { received = params; }, undefined, true);

  expect(received).toBeDefined();
  expect(received.prevState).toBe(received.nextState);
  expect(received.prevState.count).toBe(0);

  unsubscribe();
});

test("immediate: prevState is the current state after listener-free batches", async () => {
  const store = createStore({ count: 0 }, { immutable: true });

  // A listener is present for the first batch, so prevBatchState is captured.
  const unsubscribe = store.subscribe(() => undefined);
  store.count = 1;
  await tick();
  unsubscribe();

  // These batches run without listeners and therefore do not refresh
  // prevBatchState.
  store.count = 2;
  await tick();
  store.count = 3;
  await tick();

  let received: any;
  store.subscribe(params => { received = params; }, undefined, true);

  expect(store.count).toBe(3);
  expect(received.prevState.count).toBe(3);
  expect(received.nextState.count).toBe(3);
});

test("batch: prevState is still the tree from before the batch", async () => {
  const store = createStore({ count: 0 }, { immutable: true });

  let received: any;
  store.subscribe(params => { received = params; });

  store.count = 1;
  await tick();

  expect(received.prevState.count).toBe(0);
  expect(received.nextState.count).toBe(1);
});
