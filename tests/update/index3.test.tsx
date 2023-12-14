import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore } from "../../src";

/** Update method and batch update */
test("batchUpdate-III", async () => {
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
          // Mixed updates also have batch effect.
          store.count++;
          expect(store.count === 1).toBeTruthy();

          store.setState({
            count: store.count + 1,
          });
          expect(store.count === 2).toBeTruthy();

          store.count++;
          expect(store.count === 3).toBeTruthy();

          store.setState({
            count: store.count + 1,
          });
          expect(store.count === 4).toBeTruthy();
        }}>batchAdd</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("batchAdd"));
  await waitFor(() => {
    getByText("4");
    expect(counter === 2).toBeTruthy();
  });
});
