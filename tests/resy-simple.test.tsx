import React from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

test("resy-simple", async () => {
  const store = createStore<{
    count: number;
    count2: number;
    text?: string;
    formRef?: any;
    formRef2?: any;
    hookValueTestEmpty?: any;
  }>({ count: 0, count2: 123, });
  
  const storeInner2 = createStore({ inner2Count: 0 });
  
  function AppInner2() {
    const { inner2Count } = useStore(storeInner2);
    return (
      <>
        <div>AppInner2-inner2Count：{inner2Count}</div>
        <div onClick={() => { storeInner2.inner2Count++; }}>
          AppInner2
        </div>
      </>
    );
  }
  
  function AppInner() {
    const { formRef2 } = useStore(store, { formRef2: React.useRef<any>() });
    
    function formBtnClick(event: any) {
      event.preventDefault();
      formRef2.current.value = "AppInnerFormRefFuncReturnTest";
    }
    
    return (
      <form>
        name2: <input id="testInput2" ref={formRef2} type="text" name="Name2"/><br/>
        <button onClick={formBtnClick} type="submit">form-button2</button>
      </form>
    );
  }
  
  const AppTest = () => {
    const { count2, formRef, text } = useStore(store, {
      formRef: React.useRef<any>(),
      text: "Hello",
    });
    
    const { hookValueTestEmpty } = useStore(store, {});
    
    function formBtnClick(event: any) {
      event.preventDefault();
      formRef.current.value = "QWE";
    }
    
    return (
      <>
        <form>
          <span>text：{`${text === "Hello"}`}</span>
          <span>{count2}</span>
          <span>{hookValueTestEmpty === undefined ? "hookValueTestEmpty" : ""}</span>
          name: <input id="testInput" ref={formRef} type="text" name="Name"/><br/>
          <button onClick={formBtnClick} type="submit">form-button</button>
        </form>
        <AppInner/>
        <AppInner2/>
      </>
    );
  }
  
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
        <AppTest/>
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
  
  const { getByText, getAllByDisplayValue } = render(<App/>);
  
  expect(getByText("text：true")).toBeInTheDocument();
  expect(getByText("hookValueTestEmpty")).toBeInTheDocument();
  
  fireEvent.click(getByText("btn-1"));
  await waitFor(() => {
    getByText("1");
  });
  
  fireEvent.click(getByText("inc-btn"));
  await waitFor(() => {
    getByText("2");
  });
  
  fireEvent.click(getByText("form-button"));
  getAllByDisplayValue("QWE");
  
  fireEvent.click(getByText("form-button2"));
  getAllByDisplayValue("AppInnerFormRefFuncReturnTest");
  
  fireEvent.click(getByText("AppInner2"));
  await waitFor(() => {
    getByText("AppInner2-inner2Count：1");
  });
});
