import React from "react";
import { test, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { createStore, useState } from "../index";

test("resy", () => {
  const store = createStore({
    count: 0,
    inc: () => store.count++,
  });
  
  const App = () => {
    const { count, inc } = useState(store);
    return (
      <>
        <p>count</p>
        <button onClick={inc}>btn1</button>
        <button onClick={() => store.count++}>btn2</button>
        <button onClick={() => (store.count = count)}>btn3</button>
      </>
    );
  };
  
  const { getByText } = render(<App />);
  
  // @ts-ignore
  expect(() => createStore()).toThrow();
  
  fireEvent.click(getByText("btn1"));
  // expect(getByText("1")).toBeInTheDocument();
  
  fireEvent.click(getByText("btn2"));
  // expect(getByText("2")).toBeInTheDocument();
  
  fireEvent.click(getByText("btn3"));
  // expect(getByText("2")).toBeInTheDocument();
});
