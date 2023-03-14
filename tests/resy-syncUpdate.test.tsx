import React from "react";
import { test, expect } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render } from "@testing-library/react";

test("resy-syncUpdate", async () => {
  const store = createStore({ text: "qwe" });
  let textRes = "";
  const App = () => {
    const { text } = useStore(store);
    
    function inputChange(event: React.ChangeEvent<HTMLInputElement>) {
      store.syncUpdate({
        text: event.target.value,
      });
      console.log("etv", event.target.value, "store.text", store.text);
      textRes = store.text;
    }
    
    return (
      <>
        <input placeholder="请输入" value={text} onChange={inputChange}/>
      </>
    );
  };
  
  const { getByPlaceholderText } = render(<App/>);
  
  fireEvent.change(getByPlaceholderText("请输入"), {
    target: {
      value: "ASDZXC",
    },
  });
  expect(textRes === store.text).toBeTruthy();
  expect("ASDZXC" === store.text).toBeTruthy();
  
  // @ts-ignore
  expect(() => store.syncUpdate(null)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(0)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate("")).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(NaN)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(Symbol("not object"))).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate([])).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(() => {})).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(true)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(false)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(new Map())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(new Set())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(undefined)).toThrowError();
});
