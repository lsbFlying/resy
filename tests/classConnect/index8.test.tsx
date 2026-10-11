import React from "react";
import { expect, test } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { ComponentWithStore, createStore } from "../../src";
import { rawMetaStore } from "../__utils__";

/**
 * @description Class-side connection contract (tasks 6.2 – 6.4), mirroring the
 * scenarios of `specs/class-store-connection`.
 */

test("class-store: this.store writes reach the state and re-render", async () => {
  const store = createStore<{ count: number; text: string }>(
    { count: 0, text: "hello" },
    { immutable: true },
  );
  const ms = rawMetaStore<{ count: number; text: string }>(store);

  class App extends ComponentWithStore {
    store = this.connectStore(store);

    render() {
      const { count } = this.store;
      return (
        <>
          <p>count:{count}</p>
          <button onClick={() => { this.store.count = 5; }}>set5</button>
          <button onClick={() => { delete (this.store as any).text; }}>delText</button>
        </>
      );
    }
  }

  const { getByText } = render(<App />);
  await waitFor(() => getByText("count:0"));

  fireEvent.click(getByText("set5"));
  await waitFor(() => getByText("count:5"));
  expect(ms._$state_.count).toBe(5);

  // Deleting a first-level key goes through the same entry point.
  fireEvent.click(getByText("delText"));
  await waitFor(() => {
    expect(Object.prototype.hasOwnProperty.call(ms._$state_, "text")).toBe(false);
  });
});

test("class-store: a nested write through this.store freezes the old snapshot", async () => {
  const store = createStore<{ userInfo: { name: string } }>(
    { userInfo: { name: "a" } },
    { immutable: true },
  );
  const ms = rawMetaStore<{ userInfo: { name: string } }>(store);

  class App extends ComponentWithStore {
    store = this.connectStore(store);

    render() {
      const { userInfo } = this.store;
      return (
        <>
          <p>name:{userInfo.name}</p>
          <button onClick={() => { this.store.userInfo.name = "b"; }}>rename</button>
        </>
      );
    }
  }

  const { getByText } = render(<App />);
  await waitFor(() => getByText("name:a"));
  const before = ms._$state_;

  fireEvent.click(getByText("rename"));
  await waitFor(() => getByText("name:b"));

  // Copy-on-write holds on the class side too.
  expect(before.userInfo.name).toBe("a");
  expect(ms._$state_).not.toBe(before);
  expect(ms._$state_.userInfo).not.toBe(before.userInfo);
});

test("class-store: re-render is filtered by the keys the component registered", async () => {
  let renderCount = 0;
  const store = createStore<{ count: number; text: string; userInfo: { name: string } }>(
    { count: 0, text: "hello", userInfo: { name: "a" } },
    { immutable: true },
  );

  class App extends ComponentWithStore {
    store = this.connectStore(store);
    /** Declared by the test so the button can trigger a sibling write. */
    bumpText = () => { store.text = "changed"; };
    bumpCount = () => { store.count = 1; };
    rename = () => { store.userInfo.name = "b"; };

    render() {
      renderCount++;
      // Only `count` is read, so only `count` is registered.
      const { count } = this.store;
      return (
        <>
          <p>count:{count}</p>
          <button onClick={this.bumpText}>text</button>
          <button onClick={this.bumpCount}>count</button>
          <button onClick={this.rename}>nested</button>
        </>
      );
    }
  }

  const { getByText } = render(<App />);
  await waitFor(() => getByText("count:0"));

  // A key the component never read must not re-render it.
  const beforeText = renderCount;
  fireEvent.click(getByText("text"));
  // A negative assertion: nothing observable should happen. `act` drains the
  // pending update queue; there is no condition to wait for here.
  await act(async () => {});
  expect(renderCount).toBe(beforeText);

  // A registered key must re-render it.
  fireEvent.click(getByText("count"));
  await waitFor(() => getByText("count:1"));
  expect(renderCount).toBeGreaterThan(beforeText);

  // A nested write under an unread top-level key must not re-render either.
  const beforeNested = renderCount;
  fireEvent.click(getByText("nested"));
  await act(async () => {});
  expect(renderCount).toBe(beforeNested);
});

test("class-store: a component that reads a nested object re-renders on nested writes", async () => {
  const store = createStore<{ userInfo: { name: string } }>(
    { userInfo: { name: "a" } },
    { immutable: true },
  );

  class App extends ComponentWithStore {
    store = this.connectStore(store);
    render() {
      // Reading `userInfo` registers the top-level key.
      const { userInfo } = this.store;
      return (
        <>
          <p>name:{userInfo.name}</p>
          <button onClick={() => { store.userInfo.name = "b"; }}>rename</button>
        </>
      );
    }
  }

  const { getByText } = render(<App />);
  await waitFor(() => getByText("name:a"));

  fireEvent.click(getByText("rename"));
  await waitFor(() => getByText("name:b"));
});

test("class-store: an unmounted component stops receiving updates", async () => {
  const store = createStore<{ count: number }>({ count: 0 }, { immutable: true });
  const ms = rawMetaStore<{ count: number }>(store);

  class App extends ComponentWithStore {
    store = this.connectStore(store);
    render() {
      const { count } = this.store;
      return <p>count:{count}</p>;
    }
  }

  const { getByText, unmount } = render(<App />);
  await waitFor(() => getByText("count:0"));
  expect(ms._updater_.classInstanceStack.size).toBe(1);

  unmount();
  await waitFor(() => {
    expect(ms._updater_.classInstanceStack.size).toBe(0);
  });

  // The connection was released and its registered references cleared.
  expect(() => { store.count = 1; }).not.toThrow();
  await act(async () => {});
});

test("class-store: class and hook components observe the same state", async () => {
  const store = createStore<{ count: number; label: string }>(
    { count: 0, label: "shared" },
    { immutable: true },
  );
  const ms = rawMetaStore<{ count: number; label: string }>(store);

  class ClassFace extends ComponentWithStore {
    store = this.connectStore(store);
    render() {
      const { count } = this.store;
      return <p>class-count:{count}</p>;
    }
  }

  const HookFace = () => {
    // The hook face reads the same store instance.
    const { count } = store.useStore();
    return <p>hook-count:{count}</p>;
  };

  const { getByText } = render(
    <>
      <ClassFace />
      <HookFace />
    </>,
  );
  await waitFor(() => getByText("class-count:0"));
  await waitFor(() => getByText("hook-count:0"));

  // A single write is observed by the class side …
  store.count = 7;
  await waitFor(() => getByText("class-count:7"));

  // … and both faces read the same resulting state.
  expect(ms._$state_.count).toBe(7);
  expect(ms._$state_.label).toBe("shared");
  expect(store.count).toBe(7);

  cleanup();
});

test("class-store: nested reads and chained writes go through the base proxy", async () => {
  type Model = {
    userInfo: { name: string; address: { city: string } };
    list: number[];
    m: Map<string, number>;
  };

  const store = createStore<Model>(
    {
      userInfo: { name: "a", address: { city: "bj" } },
      list: [1],
      m: new Map([["k", 1]]),
    },
    { immutable: true },
  );
  const ms = rawMetaStore<Model>(store);
  const raw = () => ms._$state_;

  let engine: any = null;

  class App extends ComponentWithStore {
    store = this.connectStore(store);
    render() {
      engine = this.store;
      const s: any = this.store;
      return <p>city:{s.userInfo.address.city}</p>;
    }
  }

  const { getByText } = render(<App />);
  await waitFor(() => getByText("city:bj"));

  // `this.store` only participates at the first level: it registers the key and
  // then delegates to the base proxy, which is what performs the lazy wrapping.
  // A nested read must therefore come back as a proxy, not the raw object — and
  // every level below it must stay reachable through that proxy.
  expect(engine.userInfo).not.toBe(raw().userInfo);
  expect(engine.userInfo.address.city).toBe("bj");

  // Chained write through the class face replaces the whole path and leaves the
  // previous tree frozen.
  const before = raw();
  engine.userInfo.address.city = "sh";
  expect(raw().userInfo.address.city).toBe("sh");
  expect(raw()).not.toBe(before);
  expect(raw().userInfo).not.toBe(before.userInfo);
  expect(before.userInfo.address.city).toBe("bj");

  // Array mutation through the class face commits a new array.
  const beforeList = raw().list;
  engine.list.push(2);
  expect(raw().list).toEqual([1, 2]);
  expect(raw().list).not.toBe(beforeList);
  expect(beforeList).toEqual([1]);

  // `Map` methods through the class face (the `apply`-trap path).
  expect(engine.m.get("k")).toBe(1);
  engine.m.set("k2", 2);
  expect(raw().m).toBeInstanceOf(Map);
  expect(raw().m.get("k2")).toBe(2);
});
