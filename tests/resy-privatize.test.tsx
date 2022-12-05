import React, { useMemo } from "react";
import { test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

test("resy-simple", async () => {
  const initialState = {
    count: 123,
    text: "QWE",
  };
  
  const InnerApp = (props: { name: string }) => {
    const { name } = props;
    /**
     * 下面两句代码相当于：const [count, setCount] = useState(123);
     * 乍一看下面两句代码反而没有react原生方式有优势
     * 但实际上在超过两个以上的数据状态的情况下，下面的写法的优势是直线上升
     */
    const store = useMemo(() => createStore(initialState, { privatization: true }), []);
    const { count, text } = useStore(store);
    return (
      <>
        <p>{name}{text}</p>
        <p>{name === "app1" ? `${count}app1` : `${count}app2`}</p>
        <button onClick={() => store.count++}>{name === "app1" ? "count1" : "count2"}</button>
        <button onClick={() => { store.text = name; }}>{name === "app1" ? "text1" : "text2"}</button>
      </>
    );
  }
  
  const App = () => {
    return (
      <>
        <InnerApp name="app1"/>
        <InnerApp name="app2"/>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("count1"));
  await waitFor(() => {
    getByText("124app1");
  });
  
  fireEvent.click(getByText("count2"));
  await waitFor(() => {
    getByText("124app2");
  });
  
  fireEvent.click(getByText("text1"));
  await waitFor(() => {
    getByText("app1app1");
  });
  
  fireEvent.click(getByText("text2"));
  await waitFor(() => {
    getByText("app2app2");
  });
});
