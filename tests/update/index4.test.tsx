import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore } from "../../src";

/** Update method and batch update */
test("batchUpdate-IV", async () => {
  const store = createStore({
    count: 0,
  });
  let counter = 0;

  const App = () => {
    const { count } = store.useData;
    counter++;
    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          store.count++;
          expect(store.count === 1).toBeTruthy();
          // The update of setTimeout and the previous sentence is divided into two batches of update processing,
          // which shows that the update mechanism of store is based on the event cycle.
          const id = setTimeout(() => {
            clearTimeout(id);
            store.setState({
              count: store.count + 1,
            });
          }, 0);
        }}>batchAdd</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("batchAdd"));
  await waitFor(() => {
    getByText("2");
    expect(counter === 3).toBeTruthy();
  });
});
