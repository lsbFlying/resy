import React, { useEffect } from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

test("resy-set-and-sub1", async () => {
  const store = createStore({ count: 0, text: "poiu" });
  const App = () => {
    const { count, text } = useStore(store);
    useEffect(() => {
      return store.subscribe((effectState) => {
        console.log(effectState.count);
        store.text = "Arosy";
      }, ["count"]);
    }, []);
    
    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <button onClick={() => store.setState({ count: count + 1 })}>inc-btn</button>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("inc-btn"));
  await waitFor(() => {
    getByText("1");
    getByText("Arosy");
  });
  
  // @ts-ignore
  expect(() => store.setState(null)).toThrowError();
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
});
