import React, { useMemo, useState } from "react";
import { test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

test("setOptions", async () => {
  const store1 = createStore({
    count: 0,
  });

  const App1 = () => {
    const { count } = useStore(store1);
    return (
      <p>App1-count:{count}</p>
    );
  };

  const AppOrigin1 = () => {
    const [show, setShow] = useState(true);
    return (
      <>
        <p>AppOrigin1:{show ? "App1" : "null"}</p>
        {show && <App1 />}
        <button
          onClick={() => {
            store1.count++;
          }}
        >
          btn-1
        </button>
        <button
          onClick={() => {
            setShow(!show);
            store1.count++;
          }}
        >
          btn-2
        </button>
        <button
          onClick={() => {
            setShow(!show);
          }}
        >
          btn-3
        </button>
      </>
    );
  };

  const store2 = createStore({
    count: 0,
  });

  const App2 = () => {
    const { count } = useStore(store2);
    return (
      <p>App2-count:{count}</p>
    );
  };

  const AppOrigin2 = () => {
    const [show, setShow] = useState(true);
    useMemo(() => {
      // 模拟业务需求设置为永久状态容器
      store2.setOptions({ unmountReset: false });
    }, []);
    return (
      <>
        <p>AppOrigin2:{show ? "App2" : "null"}</p>
        {show && <App2 />}
        <button
          onClick={() => {
            store2.count++;
          }}
        >
          btn-4
        </button>
        <button
          onClick={() => {
            setShow(!show);
            store2.count++;
          }}
        >
          btn-5
        </button>
        <button
          onClick={() => {
            setShow(!show);
          }}
        >
          btn-6
        </button>
      </>
    );
  };

  const { getByText } = render(
    <>
      <AppOrigin1 />
      <AppOrigin2 />
    </>
  );

  fireEvent.click(getByText("btn-1"));
  await waitFor(() => {
    console.log(1, store1.count);
    getByText("App1-count:1");
    getByText("AppOrigin1:App1");
  });

  fireEvent.click(getByText("btn-2"));
  await waitFor(() => {
    console.log(2, store1.count);
    getByText("AppOrigin1:null");
  });

  fireEvent.click(getByText("btn-3"));
  await waitFor(() => {
    console.log(3, store2.count);
    getByText("App2-count:0");
    getByText("AppOrigin2:App2");
  });

  fireEvent.click(getByText("btn-4"));
  await waitFor(() => {
    console.log(4, store2.count);
    getByText("App2-count:1");
    getByText("AppOrigin2:App2");
  });

  fireEvent.click(getByText("btn-5"));
  await waitFor(() => {
    console.log(5, store2.count);
    getByText("AppOrigin2:null");
  });

  fireEvent.click(getByText("btn-6"));
  await waitFor(() => {
    console.log(6, store2.count);
    getByText("App2-count:2");
    getByText("AppOrigin2:App2");
  });
});
