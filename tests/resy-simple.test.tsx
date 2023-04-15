import React from "react";
import { expect, test } from "vitest";
import { createStore, useConciseState, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

type State = {
  count: number;
  text?: string;
  value: string;
  name: string;
};

test("resy-simple", async () => {
  const store = createStore<State>({
    count: 0,
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
  
  /** 测试初始化入参报错 start */
  // @ts-ignore
  expect(() => createStore(0)).toThrowError();
  // @ts-ignore
  expect(() => createStore(1)).toThrowError();
  // @ts-ignore
  expect(() => createStore(null)).toThrowError();
  // @ts-ignore
  expect(() => createStore(false)).toThrowError();
  // @ts-ignore
  expect(() => createStore(NaN)).toThrowError();
  // @ts-ignore
  expect(() => createStore("")).toThrowError();
  /** 测试初始化入参报错 end */
  
  /** 测试store类型报错 start */
  // @ts-ignore
  expect(() => useStore(123)).toThrowError();
  // @ts-ignore
  expect(() => useStore("123")).toThrowError();
  // @ts-ignore
  expect(() => useStore({})).toThrowError();
  // @ts-ignore
  expect(() => useStore(() => {})).toThrowError();
  // @ts-ignore
  expect(() => useStore([])).toThrowError();
  // @ts-ignore
  expect(() => useStore(null)).toThrowError();
  // @ts-ignore
  expect(() => useStore(undefined)).toThrowError();
  // @ts-ignore
  expect(() => useStore(new Symbol())).toThrowError();
  // @ts-ignore
  expect(() => useStore(NaN)).toThrowError();
  // @ts-ignore
  expect(() => useStore(true)).toThrowError();
  // @ts-ignore
  expect(() => useStore(new Map())).toThrowError();
  // @ts-ignore
  expect(() => useStore(new Set())).toThrowError();
  /** 测试store类型报错 end */
  
  /** 测试store类型报错 start */
  // @ts-ignore
  expect(() => useConciseState(123)).toThrowError();
  // @ts-ignore
  expect(() => useConciseState("123")).toThrowError();
  // @ts-ignore
  expect(() => useConciseState({})).toThrowError();
  // @ts-ignore
  expect(() => useConciseState(() => {})).toThrowError();
  // @ts-ignore
  expect(() => useConciseState([])).toThrowError();
  // @ts-ignore
  expect(() => useConciseState(null)).toThrowError();
  // @ts-ignore
  expect(() => useConciseState(undefined)).toThrowError();
  // @ts-ignore
  expect(() => useConciseState(new Symbol())).toThrowError();
  // @ts-ignore
  expect(() => useConciseState(NaN)).toThrowError();
  // @ts-ignore
  expect(() => useConciseState(true)).toThrowError();
  // @ts-ignore
  expect(() => useConciseState(new Map())).toThrowError();
  // @ts-ignore
  expect(() => useConciseState(new Set())).toThrowError();
  /** 测试store类型报错 end */
  
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
