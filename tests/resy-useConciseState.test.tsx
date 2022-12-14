import React from "react";
import { test } from "vitest";
import { useConciseState } from "../src";
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
    const { count, text, setState } = useConciseState(initialState);
    return (
      <>
        <p>{name}{text}</p>
        <p>{name === "app1" ? `${count}app1` : `${count}app2`}</p>
        <button onClick={() => setState({count: count + 1})}>
          {name === "app1" ? "count1" : "count2"}
        </button>
        <button onClick={() => { setState({text: name}); }}>
          {name === "app1" ? "text1" : "text2"}
        </button>
      </>
    );
  }
  
  function InnerTest() {
    const { flag, text, setState } = useConciseState(() => ({ flag: true, text: "Hello" }));
    return (
      <>
        <p
          onClick={() => {
            setState({
              flag: !flag,
            }, () => {
              setState({
                text: "OK",
              });
            });
          }}
        >
          {flag ? "flag-123" : "flag-456"}
        </p>
        <span>{text}</span>
      </>
    );
  }

  const App = () => {
    return (
      <>
        <InnerApp name="app1"/>
        <InnerApp name="app2"/>
        <InnerTest/>
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
  
  fireEvent.click(getByText("flag-123"));
  await waitFor(() => {
    getByText("flag-456");
    getByText("OK");
  });
});
