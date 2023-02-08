import React from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

type State = {
  count: number;
  count2: number;
  text?: string;
  hookValueTestEmpty?: any;
  value: string;
  name: string;
};

test("resy-simple", async () => {
  const store = createStore<State>({
    count: 0,
    count2: 123,
    name: "resy-simple",
    get value() {
      return this.name;
    },
  });
  
  const obj = {
    name: "Obj-FGH",
  };
  Object.setPrototypeOf(obj, store);
  
  // @ts-ignore
  console.log("obj.value：", obj.value);
  // @ts-ignore
  expect(obj.value === "Obj-FGH").toBeTruthy();
  
  const App = () => {
    const state = useStore(store);
    return (
      <>
        <p>{state.count}</p>
        <span>{state.text || ""}</span>
        <button onClick={() => {
          store.count++;
        }}>btn-1</button>
        <button onClick={() => {
          store.count++;
          store.setState({
            text: "test text",
          });
        }}>inc-btn</button>
      </>
    );
  };
  
  // @ts-ignore 测试初始化入参报错
  expect(() => createStore(0)).toThrowError();
  // @ts-ignore 测试初始化入参报错
  expect(() => createStore(null)).toThrowError();
  // @ts-ignore 测试初始化入参报错
  expect(() => createStore(false)).toThrowError();
  // @ts-ignore 测试初始化入参报错
  expect(() => createStore(NaN)).toThrowError();
  // @ts-ignore 测试初始化入参报错
  expect(() => createStore("")).toThrowError();
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("btn-1"));
  await waitFor(() => {
    getByText("1");
  });
  
  fireEvent.click(getByText("inc-btn"));
  await waitFor(() => {
    getByText("2");
  });
});
