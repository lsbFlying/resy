import React, { useEffect } from "react";
import { test, expect } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

test("resy-createStore", async () => {
  const store0 = createStore<{ count: number }>({ count: 998 });
  const store = createStore<{
    show: boolean;
    loginInfo: { name?: string; age?: number; msg?: string; },
  }>({
    show: true,
    loginInfo: {},
  }, {
    initialReset: false,
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
  
  const App = () => {
    const { show } = useStore(store);
    
    return (
      <div>
        <button onClick={() => {
          store.show = !store.show;
          store0.count++;
        }}>initialResetBtn</button>
        <p>
          {
            show
              ? <LoginInfo/>
              : <span>LoginInfo-Null</span>
          }
        </p>
      </div>
    );
  };
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("initialResetBtn"));
  await waitFor(() => {
    getByText("LoginInfo-Null");
    expect(JSON.stringify(store.loginInfo) === '{"name":"L","age":28,"msg":"Hello, createStore"}').toBeTruthy();
    expect(store0.count === 999).toBeTruthy();
  });
  
  fireEvent.click(getByText("initialResetBtn"));
  await waitFor(() => {
    expect(store0.count === 998).toBeTruthy();
  });
});
