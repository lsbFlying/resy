import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Read and use directly without deconstruction */
test("notDeconstructUse", async () => {
  type Store = {
    count: number;
  };

  const store = createStore<Store>({
    count: 0,
  });

  const App = () => {
    const state = useStore(store);

    return (
      <>
        <p>{state.count}</p>
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
