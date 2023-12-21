import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { useConciseState } from "../../src";

/** The use mode of useConciseState */
test("useConciseState-III", async () => {
  const App = () => {
    const { count, setState, restore } = useConciseState({ count: 0 });

    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          setState({
            count: 1,
          });
        }}>add1</button>
        <button onClick={() => {
          restore(nextState => {
            expect(nextState.count === 0).toBeTruthy();
          });
        }}>restoreAction</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add1"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("restoreAction"));
  await waitFor(() => {
    getByText("0");
  });
});
