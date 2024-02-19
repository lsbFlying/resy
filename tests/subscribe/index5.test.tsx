import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Use mode of useSubscribe */
test("store.useSubscribe-basic-I", async () => {
  const store = createStore({
    count: 0,
    text: "hello",
  });

  const App = () => {
    const { count, text } = useStore(store);
    store.useSubscribe(({
      effectState,
      nextState,
      prevState,
    }) => {
      console.log(effectState, nextState, prevState);
      if (Object.keys(effectState).length === 1 && effectState.count === 1) {
        expect(nextState.count === 1).toBeTruthy();
        expect(nextState.text === "hello").toBeTruthy();
        expect(prevState.count === 0).toBeTruthy();
        expect(prevState.text === "hello").toBeTruthy();
      }
      if (Object.keys(effectState).length === 1 && effectState.text === "hello world") {
        expect(nextState.count === 1).toBeTruthy();
        expect(nextState.text === "hello world").toBeTruthy();
        expect(prevState.count === 1).toBeTruthy();
        expect(prevState.text === "hello").toBeTruthy();
      }
      if (Object.keys(effectState).length === 2 && effectState.text === "ok" && effectState.count === 9) {
        expect(nextState.count === 9).toBeTruthy();
        expect(nextState.text === "ok").toBeTruthy();
        expect(prevState.count === 1).toBeTruthy();
        expect(prevState.text === "hello world").toBeTruthy();
      }
      if (Object.keys(effectState).length === 2 && effectState.text === "hello" && effectState.count === 0) {
        expect(nextState.count === 0).toBeTruthy();
        expect(nextState.text === "hello").toBeTruthy();
        expect(prevState.count === 9).toBeTruthy();
        expect(prevState.text === "ok").toBeTruthy();
      }
    });
    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <button onClick={() => {
          store.count++;
        }}>btn1</button>
        <button onClick={() => {
          store.setState({
            text: "hello world",
          });
        }}>btn2</button>
        <button onClick={() => {
          store.syncUpdate({
            count: 9,
            text: "ok",
          });
        }}>btn3</button>
        <button onClick={() => {
          store.restore();
        }}>btn4</button>
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
    getByText("hello world");
  });

  fireEvent.click(getByText("btn3"));
  await waitFor(() => {
    getByText("9");
    getByText("ok");
  });

  fireEvent.click(getByText("btn4"));
  await waitFor(() => {
    getByText("0");
    getByText("hello");
  });
});
