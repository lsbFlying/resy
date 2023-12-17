import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore } from "../../src";

/** Use mode of setState */
test("setState-III", async () => {
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
          }, () => {
            console.log("one");
            store.setState({
              count: store.count + 1,
            }, () => {
              console.log("two");
              store.setState({
                count: store.count + 1,
              }, () => {
                console.log("three");
                store.setState({
                  count: store.count + 1,
                });
              });
            });
          });
        }}>countChange</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    getByText("4");
    console.log("counter", counter);
    expect(counter === 2).toBeTruthy();
  });
});
