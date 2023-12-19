import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Use mode of restore */
test("restore-I", async () => {
  const store = createStore({
    count: 0,
  });

  const App = () => {
    const { count } = useStore(store);

    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          store.count++;
        }}>add</button>
        <button onClick={() => {
          store.restore(nextState => {
            expect(nextState.count === 0).toBeTruthy();
          });
        }}>restoreBtn</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("restoreBtn"));
  await waitFor(() => {
    getByText("0");
  });
});
