import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore } from "../../src";

/** The simplest basic use */
test("simplestBasic-II", async () => {
  type Store = {
    count: number;
  };

  const store = createStore<Store>({
    count: 0,
  });

  const App = () => {
    // store.useStore() is equivalent to useStore(store)
    const { count } = store.useStore();

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
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("subtract"));
  await waitFor(() => {
    getByText("0");
  });
});
