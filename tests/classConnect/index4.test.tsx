import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ComponentWithStore, createStore } from "../../src";

/** Test the running scenario in strict mode */
test("strictMode-Class", async () => {
  type Store = {
    count: number;
  };

  const store = createStore<Store>({
    count: 0,
  });

  class App extends ComponentWithStore {

    store = this.connectStore(store);

    render() {
      const { count } = this.store;
      return (
        <>
          <p>{count}</p>
          <button onClick={() => {
            store.count++;
          }}>add</button>
          <button onClick={() => {
            store.count--;
          }}>subtract</button>
        </>
      );
    }
  }

  const { getByText } = render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("subtract"));
  await waitFor(() => {
    getByText("0");
  });
});
