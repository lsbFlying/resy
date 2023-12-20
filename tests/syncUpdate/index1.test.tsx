import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Use mode of syncUpdate */
test("syncUpdate-basic-I", async () => {
  const store = createStore({
    count: 0,
  });
  let counter = 0;

  const App = () => {
    const { count } = useStore(store);
    counter++;
    console.log("App", counter, Date.now());
    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          store.syncUpdate({
            count: count + 1,
          });
        }}>btn1</button>
        <button onClick={() => {
          store.syncUpdate(prevState => ({
            count: prevState.count + 1,
          }));
        }}>btn2</button>
        <button onClick={() => {
          store.syncUpdate({
            count: store.count + 1,
          }, nextState => {
            expect(nextState.count === 3).toBeTruthy();
          });
        }}>btn3</button>
        <button onClick={() => {
          // empty object, no updates
          store.syncUpdate({});
        }}>btn4</button>
        <button onClick={() => {
          // store self, no updates
          store.syncUpdate(store);
        }}>btn5</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("btn1"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("btn2"));
  await waitFor(() => {
    getByText("2");
  });

  fireEvent.click(getByText("btn3"));
  await waitFor(() => {
    getByText("3");
  });

  fireEvent.click(getByText("btn4"));
  await waitFor(() => {
    getByText("3");
  });

  fireEvent.click(getByText("btn4"));
  await waitFor(() => {
    getByText("3");
  });
});
