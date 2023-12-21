import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { useConciseState } from "../../src";

/** The use mode of useConciseState */
test("useConciseState-I", async () => {
  const App = () => {
    const { count, text, setState } = useConciseState({ count: 0, text: "hello" });

    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <button onClick={() => {
          setState({
            count: 1,
            text: "world",
          });
        }}>add1</button>
        <button onClick={() => {
          setState(prevState => ({
            count: prevState.count + 1,
          }));
        }}>add2</button>
        <button onClick={() => {
          setState({
            count: 9,
          }, nextState => {
            setState({
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
    getByText("world");
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
