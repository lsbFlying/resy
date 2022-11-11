import React, {useEffect} from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";

test("resy-simple", async () => {
  const store = createStore<{
    count: number;
    count2: number;
    text?: string;
    formRef?: any;
    hookValueTestEmpty?: any;
  }>({ count: 0, count2: 123, });
  
  const AppTest = () => {
    const { count2, formRef } = useStore(store, { formRef: React.useRef<any>() });
  
    const { hookValueTestEmpty } = useStore(store, {});
    
    function formBtnClick(event: any) {
      event.preventDefault();
      formRef.current.value = "QWE";
    }
    
    useEffect(() => {
      store.count2 = 999;
    }, [formRef.current]);
    
    return (
      <form>
        <span>{count2}</span>
        <span>{hookValueTestEmpty === undefined ? "hookValueTestEmpty" : ""}</span>
        name: <input id="testInput" ref={formRef} type="text" name="Name"/><br/>
        <button onClick={formBtnClick} type="submit">form-button</button>
      </form>
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
          store.setState({
            text: "test text",
          });
        }}>inc-btn</button>
        <AppTest/>
      </>
    );
  };
  
  // @ts-ignore
  expect(() => createStore()).toThrowError();
  
  const { getByText } = render(<App/>);
  
  expect(getByText("hookValueTestEmpty")).toBeInTheDocument();
  
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
