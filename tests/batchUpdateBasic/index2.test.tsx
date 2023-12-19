import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore } from "../../src";

/** Update method and batch update */
test("batchUpdateBasic-II", async () => {
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
          store.setState({
            count: store.count + 1,
          });
          expect(store.count === 1).toBeTruthy();

          store.setState({
            count: store.count + 1,
          });
          expect(store.count === 2).toBeTruthy();

          store.setState({
            count: store.count + 1,
          });
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
