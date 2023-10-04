import React, { useEffect } from "react";
import { test, expect } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

const originTime = `${Date.now()}${Math.random() * 100}`;

test("resy-createStore", async () => {
  const storeFn = createStore<{ time: string; text?: string }>(() => {
    const curTime = `${Date.now()}${Math.random() * 100}`;
    return {
      time: originTime === curTime ? originTime : curTime,
    };
  });
  const store0 = createStore<{ count: number }>({ count: 998 });
  const store = createStore<{
    show: boolean;
    loginInfo: { name?: string; age?: number; msg?: string };
  }>({
    show: true,
    loginInfo: {},
  }, {
    unmountReset: false,
  });

  function LoginInfo() {
    const { count } = useStore(store0);
    const { loginInfo: { name, age, msg } } = useStore(store);

    useEffect(() => {
      store.loginInfo = { name: "L", age: 28, msg: "Hello, createStore" };
    }, []);

    return (
      <span>name:{name}; age:{age}; msg:{msg}; count:{count}</span>
    );
  }

  function TimeCheck() {
    const { time } = useStore(storeFn);

    // 可以看到三次打印出来的时间与随机数都不一样
    console.log("time", time);

    return (
      <>
        <span>LoginInfo-Null</span>
        <span>time:{time}</span>
      </>
    );
  }

  const App = () => {
    const { text } = useStore(storeFn);
    const { show } = useStore(store);

    return (
      <div>
        <span>text:{text}</span>
        <button onClick={() => {
          storeFn.text = "hello-restore";
        }}>restore-prev-handle-btn</button>
        <button onClick={() => {
          store.show = !store.show;
          store0.count++;
          storeFn.restore();
        }}>restoreBtn</button>
        <p>
          {show ? <LoginInfo /> : <TimeCheck />}
        </p>
      </div>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("restore-prev-handle-btn"));
  await waitFor(() => {
    getByText("text:hello-restore");
  });

  fireEvent.click(getByText("restoreBtn"));
  await waitFor(() => {
    getByText("LoginInfo-Null");
    getByText("text:");
    expect(JSON.stringify(store.loginInfo) === "{\"name\":\"L\",\"age\":28,\"msg\":\"Hello, createStore\"}").toBeTruthy();
    expect(store0.count === 999).toBeTruthy();
  });

  fireEvent.click(getByText("restoreBtn"));
  await waitFor(() => {
    expect(store0.count === 1000).toBeTruthy();
  });

  fireEvent.click(getByText("restoreBtn"));
  await waitFor(() => {
    expect(store0.count === 1001).toBeTruthy();
  });
});
