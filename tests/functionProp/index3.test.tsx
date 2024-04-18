import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ComponentWithStore, createStore } from "../../src";

/**
 * The use of function properties
 * @description 1、Validate that function properties, just like regular data properties,
 * can serve as state for updating component rendering as long as they are accessed through class component.
 * 2、Validate that function properties do not have the capacity to update components as state
 * if they are accessed directly through the store instead of being fetched from class component.
 */
test("functionProp-class-component", async () => {
  type Store = {
    count: number;
    testFn?(): void;
    testFn2?(): void;
  };

  const store = createStore<Store>({
    count: 0,
  });

  class App extends ComponentWithStore {
    store = this.connectStore(store);

    render() {
      const { count, testFn } = this.store;
      const { testFn2 } = store;
      return (
        <>
          <p>{count}</p>
          <p>{testFn ? "testFnExist" : "testFnNull"}</p>
          <p>{testFn2 ? "testFn2Exist" : "testFn2Null"}</p>
          <button onClick={() => {
            store.testFn = () => {
              store.count++;
            };
          }}>genTestFn</button>
          <button onClick={() => {
            store.testFn!();
          }}>callTestFn</button>
          <button onClick={() => {
            store.testFn = undefined;
          }}>delTestFn</button>

          <button onClick={() => {
            store.testFn2 = () => {
              store.count--;
            };
          }}>genTestFn2</button>
          <button onClick={() => {
            store.testFn2!();
          }}>callTestFn2</button>
          <button onClick={() => {
            store.testFn2!();
          }}>delTestFn2</button>
        </>
      );
    }
  }

  const { getByText } = render(<App />);

  fireEvent.click(getByText("genTestFn"));
  await waitFor(() => {
    getByText("testFnExist");
  });

  fireEvent.click(getByText("callTestFn"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("delTestFn"));
  await waitFor(() => {
    getByText("testFnNull");
  });

  fireEvent.click(getByText("genTestFn2"));
  await waitFor(() => {
    getByText("testFn2Null");
  });

  fireEvent.click(getByText("callTestFn2"));
  await waitFor(() => {
    getByText("0");
  });

  fireEvent.click(getByText("delTestFn"));
  await waitFor(() => {
    getByText("testFn2Exist");
  });
});
