import React, { useEffect, useRef } from "react";
import { expect, test } from "vitest";
import { createStore, useConciseState, useStoreWithRef, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

type State = {
  count: number;
  refName?: string;
};

test("resy-useStoreWithRef", async () => {
  const store = createStore<State>({
    count: 0,
  });
  
  function RefCom() {
    const { refName } = useStore(store);
    
    useEffect(() => {
      expect(store.refName === refName).toBeTruthy();
    }, []);
    
    return (
      <>
        <p>ref-com-refName:{refName}</p>
        <button onClick={() => {
          store.syncUpdate({ refName: "newRefName" });
        }}>ref-btn1</button>
        <button>ref-btn2</button>
        <button>ref-btn3</button>
      </>
    );
  }
  
  const App = () => {
    const refTemp = useRef({ refName: "useStoreWithRefUnitTest" });
    const { count, refName } = useStoreWithRef(store, refTemp.current);
    return (
      <>
        <RefCom/>
        <p>count:{count}</p>
        <p>refName:{refName}</p>
        <button onClick={() => {
          store.count++;
        }}>btn</button>
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
  /** 测试store类型报错 end */
  
  /** 测试store类型报错 start */
  // @ts-ignore
  expect(() => useStoreWithRef(123)).toThrowError();
  // @ts-ignore
  expect(() => useStoreWithRef("123")).toThrowError();
  // @ts-ignore
  expect(() => useStoreWithRef({})).toThrowError();
  // @ts-ignore
  expect(() => useStoreWithRef(() => {})).toThrowError();
  // @ts-ignore
  expect(() => useStoreWithRef([])).toThrowError();
  // @ts-ignore
  expect(() => useStoreWithRef(null)).toThrowError();
  // @ts-ignore
  expect(() => useStoreWithRef(undefined)).toThrowError();
  // @ts-ignore
  expect(() => useStoreWithRef(new Symbol())).toThrowError();
  // @ts-ignore
  expect(() => useStoreWithRef(NaN)).toThrowError();
  // @ts-ignore
  expect(() => useStoreWithRef(true)).toThrowError();
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
  /** 测试store类型报错 end */
  
  fireEvent.click(getByText("btn"));
  await waitFor(() => {
    getByText("count:1");
  });
  
  // todo I haven't found a good test method to test internal errors. To be optimized
  // await expect(() => { return Promise.resolve().then(() => store.refName = "newRefName"); }).rejects.toHaveErrorMessage();
  // expect(() => store.setState({ refName: "newRefName" })).toThrowError();
  expect(() => store.syncUpdate({ refName: "newRefName" })).toThrowError();
});
