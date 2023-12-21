import React, { useEffect } from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { useConciseState } from "../../src";

/** The use mode of useConciseState */
test("useConciseState-V", async () => {
  const App = () => {
    const { count, text, setState, subscribe } = useConciseState({ count: 0, text: "hello" });
    useEffect(() => subscribe(({
      effectState, nextState, prevState,
    }) => {
      console.log(effectState, nextState, prevState);
      if (effectState.count === 2) {
        setState({
          text: "hello world",
        });
      }
    }, ["count"]), []);

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
    getByText("hello world");
  });
});
