import React, { useMemo, useState } from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

test("setOptions", async () => {
  const store0 = createStore({
    count: 0,
  });

  const App0 = () => {
    const { count } = useStore(store0);
    return (
      <p>App0-count:{count}</p>
    );
  };

  const AppOrigin0 = () => {
    const [show, setShow] = useState(true);
    useMemo(() => {
      // no effect
      // @ts-ignore
      store0.setOptions();
      // no effect
      // @ts-ignore
      store0.setOptions(undefined);
    }, []);
    return (
      <>
        <p>AppOrigin0:{show ? "App0" : "null"}</p>
        {show && <App0 />}
        <button
          onClick={() => {
            store0.count++;
          }}
        >
          btn-01
        </button>
        <button
          onClick={() => {
            setShow(!show);
            store0.count++;
          }}
        >
          btn-02
        </button>
        <button
          onClick={() => {
            setShow(!show);
          }}
        >
          btn-03
        </button>
      </>
    );
  };

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
      // @ts-ignore
      expect(() => store2.setOptions(0)).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions(1)).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions(null)).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions(false)).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions(NaN)).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions("")).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions({})).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions([])).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions(Symbol("empty-symbol"))).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions(new Set())).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions(new Map())).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions(new WeakSet())).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions(new WeakMap())).toThrowError();
      // @ts-ignore
      expect(() => store2.setOptions(new WeakRef())).toThrowError();
      // 模拟业务需求设置为永久状态容器
      store2.setOptions({ unmountRestore: false });
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
      <AppOrigin0 />
      <AppOrigin1 />
      <AppOrigin2 />
    </>
  );

  fireEvent.click(getByText("btn-01"));
  await waitFor(() => {
    console.log("01", store0.count);
    getByText("App0-count:1");
    getByText("AppOrigin0:App0");
  });

  fireEvent.click(getByText("btn-02"));
  await waitFor(() => {
    console.log("02", store0.count);
    getByText("AppOrigin0:null");
  });

  fireEvent.click(getByText("btn-03"));
  await waitFor(() => {
    console.log("03", store0.count);
    getByText("App0-count:0");
    getByText("AppOrigin0:App0");
  });

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
    console.log(3, store1.count);
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
