import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";
import { batchUpdateShimRun } from "../../src/static";

/** Function Test of "batchUpdateShimRun" */
test("batchUpdateShimRun", async () => {
  type Store = {
    count: number;
  };

  const store = createStore<Store>({
    count: 0,
  });

  const App = () => {
    const { count } = useStore(store);

    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          batchUpdateShimRun(() => store.setState({
            count: 999,
          }));
        }}>change</button>
        <button onClick={() => {
          batchUpdateShimRun(function () {
            store.setState({
              count: 9999,
            });
          });
        }}>change2</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("change"));
  await waitFor(() => {
    getByText("999");
  });

  fireEvent.click(getByText("change2"));
  await waitFor(() => {
    getByText("9999");
  });
});
