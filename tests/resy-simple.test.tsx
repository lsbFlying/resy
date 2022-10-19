import React from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";

test("resy-simple", async () => {
  const store = createStore({ count: 0 });
  const App = () => {
    const state = useStore(store);
    return (
      <>
        <p>{state.count}</p>
        <button onClick={() => store.count++}>inc-btn</button>
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
});
