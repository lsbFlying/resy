import React from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import {fireEvent, render, waitFor} from "@testing-library/react";

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
  
  const { getByText, getAllByDisplayValue } = render(<App/>);
  
  expect(getByText("hookValueTestEmpty")).toBeInTheDocument();
  
  fireEvent.click(getByText("inc-btn"));
  await waitFor(() => {
    getByText("1");
  })
  
  fireEvent.click(getByText("form-button"));
  getAllByDisplayValue("QWE");
});
