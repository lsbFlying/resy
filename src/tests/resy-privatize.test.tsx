import React, { useMemo } from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../index";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";

test("resy-simple", async () => {
  const initialState = {
    count: 123,
  };
  
  const App = () => {
    /**
     * 下面两句代码相当于：const [count, setCount] = useState(123);
     * 乍一看下面两句代码反而没有react原生方式有优势
     * 但实际上在超过两个以上的数据状态的情况下，下面的写法的优势是直线上升
     */
    const store = useMemo(() => createStore(initialState), []);
    const state = useStore(store);
    return (
      <>
        <p>{state.count}</p>
        <button onClick={() => store.count++}>inc-btn</button>
      </>
    );
  };
  
  const { getByText } = render(<App />);
  
  await act(() => {
    fireEvent.click(getByText("inc-btn"));
  });
  
  expect(getByText("124")).toBeInTheDocument();
});
