import React, { useEffect } from "react";
import { expect, test } from "vitest";
import { createStore, useStore, useStoreWithRef } from "../src";
import {fireEvent, render, waitFor} from "@testing-library/react";

type State = {
  count: number;
  refName?: string;
};

test("resy-useStoreWithRef-2", async () => {
  const store = createStore<State>({
    count: 0,
  });
  
  function RefApp() {
    const { refName } = useStoreWithRef(store, {
      refName: "ref-name-test",
    });
    
    useEffect(() => {
      console.log(store.refName, refName);
      expect(store.refName === refName).toBeTruthy();
    }, []);
    
    return (
      <p>ref-com-refName:{refName}</p>
    );
  }
  
  function App() {
    const { count } = useStore(store);
    /** 测试store、refData类型报错 start */
    // @ts-ignore
    expect(() => useStoreWithRef(store, 123)).toThrowError();
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
    expect(() => useStoreWithRef(Symbol())).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(NaN)).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(true)).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(new Map())).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(new Set())).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(store, 123)).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(store, "123")).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(store, () => {})).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(store, [])).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(store, null)).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(store, new Symbol())).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(store, NaN)).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(store, true)).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(store, new Map())).toThrowError();
    // @ts-ignore
    expect(() => useStoreWithRef(store, new Set())).toThrowError();
    /** 测试store、refData类型报错 end */
    
    return (
      <>
        <p>{count}</p>
        <button onClick={() => store.count++}>ref-btn1</button>
        <button onClick={() => store.count = 999}>ref-btn2</button>
        {(count === 0 || count === 999) && <RefApp/>}
      </>
    );
  }
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("ref-btn1"));
  await waitFor(() => {
    getByText("1");
  });
  fireEvent.click(getByText("ref-btn2"));
  await waitFor(() => {
    getByText("999");
  });
});
