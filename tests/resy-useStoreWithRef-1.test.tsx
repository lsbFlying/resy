import React, { useEffect, useRef } from "react";
import { expect, test } from "vitest";
import { createStore, useConciseState, useStoreWithRef, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

type State = {
  count: number;
  refName?: string;
  refName2?: string;
};

test("resy-useStoreWithRef-1", async () => {
  const store = createStore<State>({
    count: 0,
  });
  
  function RefCom() {
    const { refName } = useStore(store);
    
    useEffect(() => {
      expect(store.refName === refName).toBeTruthy();
    }, []);
    
    return (
      <p>ref-com-refName:{refName}</p>
    );
  }
  
  function App0() {
    const refTemp = useRef({ refName: "useStoreWithRefUnitTest" });
    const { count, refName } = useStoreWithRef(store, refTemp.current);
    console.log("App0-refName", refName);
    return (
      <div>
        App0-count:{count}
      </div>
    );
  }
  
  function App1() {
    const { count, refName2 } = useStoreWithRef(store, {
      refName2: useRef("refName2-use-way").current,
    });
    console.log("App1-refName2", refName2);
    return (
      <div>
        App1-count:{count}
      </div>
    );
  }
  
  const App = () => {
    const { count, refName } = useStore(store);
    return (
      <>
        {count <= 1 && <App0/>}
        {count <= 2 && <App1/>}
        <RefCom/>
        <p>count:{count}</p>
        <p>refName:{refName}</p>
        <button onClick={() => {
          store.count = 1;
        }}>btn1</button>
        <button onClick={() => {
          store.count = 2;
        }}>btn2</button>
        <button onClick={() => {
          store.count = 3;
        }}>btn3</button>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
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
  
  fireEvent.click(getByText("btn1"));
  await waitFor(() => {
    getByText("count:1");
  });
  
  expect(() => store.refName = "newRefName").toThrowError();
  expect(() => store.setState({ refName: "newRefName" })).toThrowError();
  expect(() => store.syncUpdate({ refName: "newRefName" })).toThrowError();
  
  fireEvent.click(getByText("btn2"));
  await waitFor(() => {
    getByText("count:2");
  });
  
  fireEvent.click(getByText("btn3"));
  await waitFor(() => {
    getByText("count:3");
  });
});
