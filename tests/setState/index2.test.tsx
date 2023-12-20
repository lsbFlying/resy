import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Use mode of setState */
test("setState-II", async () => {
  const store = createStore({
    text: "world",
    count: 0,
  });
  let counter = 0;

  const App = () => {
    const { text, count } = useStore(store);
    counter++;
    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <button onClick={() => {
          store.setState({
            text: "hello",
          }, () => {
            store.text = "hello after";
          });
        }}>changeText1</button>
        <button onClick={() => {
          store.setState({
            text: "hello temp",
          }, nextState => {
            expect(nextState.count === 0).toBeTruthy();
            // Thus it can be seen that nextState is the updated state of the current sentence of code,
            // not the updated state of this batch, it's safe.
            expect(store.count === 9).toBeTruthy();
            store.text = "hello after again";
          });
          store.count = 9;
        }}>changeText2</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("changeText1"));
  await waitFor(() => {
    getByText("hello after");
    // Thus it can be seen that updates in the setState callback function will also have update batches.
    expect(counter === 2).toBeTruthy();
  });

  fireEvent.click(getByText("changeText2"));
  await waitFor(() => {
    getByText("hello after again");
    getByText("9");
    expect(counter === 3).toBeTruthy();
  });
});
