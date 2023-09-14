import React, { useEffect } from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

test("resy-set-and-sub1", async () => {
  const store = createStore({ count: 0, text: "poiu", text2: "hello" });
  const App = () => {
    const { count, text, text2 } = useStore(store);
    useEffect(() => store.subscribe(({ effectState }) => {
      console.log(effectState.count);
      store.text = "Arosy";
    }, ["count"]), []);

    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <p>text2:{text2}</p>
        <button onClick={() => store.setState({ count: count + 1 })}>inc-btn</button>
        <button onClick={() => {
          store.setState({ count: count + 1 }, nextState => {
            expect(nextState.count === store.count).toBeTruthy();
            expect(nextState.count === 2).toBeTruthy();
            expect(nextState.text2 !== store.text2).toBeTruthy();
            expect(nextState.text2 === "hello").toBeTruthy();
            expect(store.text2 === "hello-sync").toBeTruthy();
          });
          store.setState({ text2: "hello-sync" }, nextState => {
            expect(nextState.count === store.count).toBeTruthy();
            expect(nextState.count === 2).toBeTruthy();
            expect(nextState.text2 === store.text2).toBeTruthy();
            expect(nextState.text2 === "hello-sync").toBeTruthy();
          });
        }}>sync-btn</button>
        <button onClick={() => {
          store.setState({ count: count + 1 }, nextState => {
            console.log("step1", nextState.count, store.count, nextState.text2, store.text2);

            expect(nextState.count === store.count).toBeTruthy();
            expect(nextState.count === 3).toBeTruthy();
            expect(nextState.text2 === store.text2).toBeTruthy();
            expect(nextState.text2 === "hello-sync").toBeTruthy();

            store.setState({ text2: "hello-inner" }, () => {
              console.log("step2", nextState.count, store.count, nextState.text, store.text);
              expect(nextState.count === store.count).toBeTruthy();
              expect(nextState.count === 3).toBeTruthy();
              expect(nextState.text2 === store.text2).toBeFalsy();
              expect(store.text2 === "hello-inner").toBeTruthy();
            });
          });
        }}>inner-btn</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("inc-btn"));
  await waitFor(() => {
    getByText("1");
    getByText("Arosy");
  });

  fireEvent.click(getByText("sync-btn"));
  await waitFor(() => {
    getByText("2");
    getByText("text2:hello-sync");
  });

  fireEvent.click(getByText("inner-btn"));
  await waitFor(() => {
    getByText("3");
    getByText("text2:hello-inner");
  });

  // @ts-ignore
  expect(() => store.setState(0)).toThrowError();
  // @ts-ignore
  expect(() => store.setState("")).toThrowError();
  // @ts-ignore
  expect(() => store.setState(NaN)).toThrowError();
  // @ts-ignore
  expect(() => store.setState(Symbol("not object"))).toThrowError();
  // @ts-ignore
  expect(() => store.setState([])).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.setState(() => {})).toThrowError();
  // @ts-ignore
  expect(() => store.setState(true)).toThrowError();
  // @ts-ignore
  expect(() => store.setState(false)).toThrowError();
  // @ts-ignore
  expect(() => store.setState(new Map())).toThrowError();
  // @ts-ignore
  expect(() => store.setState(new Set())).toThrowError();
  // @ts-ignore
  expect(() => store.setState(undefined)).toThrowError();
  // @ts-ignore
  expect(() => store.setState(store)).toThrowError();
});
