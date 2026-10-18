import React, { useEffect } from "react";
import { expect, test, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

// Detached writes emit a development warning; the point of this file is the
// React behaviour, so keep the diagnostics out of the output.
vi.spyOn(console, "warn").mockImplementation(() => {});

/**
 * @description Render-level proof for detached writes (task 8.5).
 *
 * The value assertions live in index11; here the point is that a detached
 * write must not reach React at all — no re-render, no DOM change, and no
 * effect rerun.
 */

type Item = { id: number; name?: string };
type ListState = { items: Item[] };

const settle = () => act(async () => {
  await new Promise<void>(resolve => { setTimeout(resolve, 0); });
});

const listStore = (initial: Item[] = [{ id: 1 }, { id: 2 }]) =>
  createStore<ListState>({ items: initial }, { immutable: true });

test("render: removing an element renders once and updates the DOM", async () => {
  const store = listStore();
  let renders = 0;

  const App = () => {
    const { items } = useStore(store);
    renders++;
    return <ul>{items.map(item => <li key={item.id}>{item.id}</li>)}</ul>;
  };

  render(<App />);
  expect(renders).toBe(1);

  act(() => { store.items.shift(); });
  await waitFor(() => { expect(screen.queryByText("1")).toBeNull(); });
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(renders).toBeGreaterThan(1);
});

test("render: writing a removed element handle does not re-render", async () => {
  const store = listStore();
  let renders = 0;

  const App = () => {
    const { items } = useStore(store);
    renders++;
    return <ul>{items.map(item => <li key={item.id}>{item.id}</li>)}</ul>;
  };

  render(<App />);
  const removed = store.items[0];
  act(() => { store.items.shift(); });
  await waitFor(() => { expect(screen.queryByText("1")).toBeNull(); });

  const rendersAfterRemoval = renders;
  act(() => { removed.id = 99; });
  await settle();

  expect(renders).toBe(rendersAfterRemoval);
  expect(screen.queryByText("99")).toBeNull();
  expect(screen.getByText("2")).toBeInTheDocument();
});

test("render: a handle whose element was replaced does not re-render", async () => {
  const store = listStore();
  let renders = 0;

  const App = () => {
    const { items } = useStore(store);
    renders++;
    return <ul>{items.map(item => <li key={item.id}>{item.id}</li>)}</ul>;
  };

  render(<App />);
  const old = store.items[0];
  act(() => { store.items[0] = { id: 9 }; });
  await waitFor(() => { expect(screen.getByText("9")).toBeInTheDocument(); });

  const rendersAfterReplace = renders;
  act(() => { old.id = 7; });
  await settle();

  expect(renders).toBe(rendersAfterReplace);
  expect(screen.queryByText("7")).toBeNull();
});

test("render: a deleted Map member handle does not re-render", async () => {
  const store = createStore(
    { m: new Map([["one", { id: 1 }], ["two", { id: 2 }]]) },
    { immutable: true },
  );
  let renders = 0;

  const App = () => {
    const { m } = useStore(store);
    renders++;
    return (
      <ul>
        <li>size:{m.size}</li>
        <li>one:{m.get("one")?.id ?? "none"}</li>
      </ul>
    );
  };

  render(<App />);
  const member = store.m.get("one")!;
  act(() => { store.m.delete("one"); });
  await waitFor(() => { expect(screen.getByText("size:1")).toBeInTheDocument(); });

  const rendersAfterDelete = renders;
  act(() => { member.id = 99; });
  await settle();

  expect(renders).toBe(rendersAfterDelete);
  expect(screen.getByText("one:none")).toBeInTheDocument();
});

test("render: an effect depending on the array does not rerun on a detached write", async () => {
  const store = listStore();
  let effects = 0;

  const App = () => {
    const { items } = useStore(store);
    useEffect(() => { effects++; }, [items]);
    return <ul>{items.map(item => <li key={item.id}>{item.id}</li>)}</ul>;
  };

  render(<App />);
  const removed = store.items[0];
  act(() => { store.items.shift(); });
  await waitFor(() => { expect(screen.queryByText("1")).toBeNull(); });

  const effectsAfterRemoval = effects;
  act(() => { removed.id = 99; });
  await settle();

  expect(effects).toBe(effectsAfterRemoval);
});

test("render: detached writes leave the rendered list untouched", async () => {
  const store = listStore([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const App = () => {
    const { items } = useStore(store);
    return <ul>{items.map(item => <li key={item.id}>{item.id}</li>)}</ul>;
  };

  render(<App />);
  const first = store.items[0];
  const last = store.items[2];
  act(() => { store.items.splice(0, 1); });
  await waitFor(() => { expect(screen.queryByText("1")).toBeNull(); });

  act(() => {
    first.id = 100;
    last.id = 300;
  });
  await settle();

  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(screen.queryByText("100")).toBeNull();
  expect(screen.queryByText("300")).toBeNull();
});
