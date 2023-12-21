import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { useConciseState } from "../../src";

/** The use mode of useConciseState */
test("useConciseState-II", async () => {
  const App = () => {
    const { count, syncUpdate } = useConciseState({ count: 0 });

    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          syncUpdate({
            count: 1,
          });
        }}>add1</button>
        <button onClick={() => {
          syncUpdate(prevState => ({
            count: prevState.count + 1,
          }));
        }}>add2</button>
        <button onClick={() => {
          syncUpdate({
            count: 9,
          }, nextState => {
            syncUpdate({
              count: nextState.count + 1,
            });
          });
        }}>add3</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add1"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("add2"));
  await waitFor(() => {
    getByText("2");
  });

  fireEvent.click(getByText("add3"));
  await waitFor(() => {
    getByText("10");
  });
});
