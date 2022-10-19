import React, {useEffect} from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";

test("resy-simple", async () => {
  const store = createStore<{
    count: number;
    count2: number;
    formRef?: any;
  }>({ count: 0, count2: 123, });
  
  const AppTest = () => {
    const { count2, formRef } = useStore(store, { formRef: React.useRef<any>() });
    
    function formBtnClick() {
      formRef.current.value = "QWE";
    }
    
    useEffect(() => {
      store.count2 = 999;
    }, [formRef.current]);
    
    return (
      <form>
        name: <input id="testInput" ref={formRef} type="text" name="Name"/><br/>
        <button onClick={formBtnClick}>form-button</button>
        <span>{count2}</span>
      </form>
    );
  }
  
  const App = () => {
    const state = useStore(store);
    return (
      <>
        <p>{state.count}</p>
        <button onClick={() => store.count++}>inc-btn</button>
        <AppTest/>
      </>
    );
  };
  
  // @ts-ignore
  expect(() => createStore()).toThrowError();
  
  const { getByText } = render(<App />);
  
  await act(() => {
    fireEvent.click(getByText("inc-btn"));
  });
  /**
   * 由于resy的更新是异步的
   * 所以这里需要等待后才能获取到页面的最新渲染
   */
  expect(getByText("1")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("form-button"));
  });
  expect(getByText("999")).toBeInTheDocument();
});
