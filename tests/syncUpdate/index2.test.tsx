import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Use mode of syncUpdate */
test("syncUpdate-basic-II", async () => {
  const store = createStore({
    count: 0,
  });
  let counter = 0;

  const App = () => {
    const { count } = useStore(store);
    counter++;
    console.log("App", count, counter, Date.now());
    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          store.count = 9;
          store.syncUpdate({
            count: store.count + 1,
          });
        }}>btn1</button>
        <button onClick={() => {
          store.count = 12;
          store.syncUpdate(prevState => {
            expect(prevState.count === 12).toBeTruthy();
            return {
              count: prevState.count + 1,
            };
          });
        }}>btn2</button>
        <button onClick={() => {
          store.setState({
            count: 19,
          });
          store.syncUpdate({
            count: store.count + 1,
          });
        }}>btn3</button>
        <button onClick={() => {
          store.setState({
            count: 23,
          });
          store.syncUpdate(prevState => {
            expect(prevState.count === 23).toBeTruthy();
            return {
              count: prevState.count + 1,
            };
          });
        }}>btn4</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("btn1"));
  await waitFor(() => {
    getByText("10");
  });
  // btn1 set count to 9 and then synced to 9 + 1.
  expect(store.count).toBe(10);

  fireEvent.click(getByText("btn2"));
  await waitFor(() => {
    getByText("13");
  });

  fireEvent.click(getByText("btn3"));
  await waitFor(() => {
    getByText("20");
  });
  // btn3 set count via setState to 19 and then synced to 19 + 1.
  expect(store.count).toBe(20);

  fireEvent.click(getByText("btn4"));
  await waitFor(() => {
    getByText("24");
    expect(counter === 5).toBeTruthy();
  });
});
