import React, { useState } from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ComponentWithStore, createStore } from "../../src";

/** Basic usage of class components */
test("classConnect-V", async () => {
  type Store = {
    count: number;
  };

  const store = createStore<Store>({
    count: 0,
  });

  /** Test whether the data recovery ability of unloading and reloading the class component is normal */
  class Child extends ComponentWithStore {

    store = this.connectStore(store);

    render() {
      const { count } = this.store;
      return (
        <>
          <p>Child-count:{count}</p>
          <button onClick={() => {
            store.count++;
          }}>add</button>
        </>
      );
    }
  }

  const App = () => {
    const [count, setCount] = useState(0);
    return (
      <>
        <p>App-count:{count}</p>
        {(count === 0 || count === 2) && <Child />}
        <button onClick={() => {
          setCount(prevState => prevState + 1);
        }}>change</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    getByText("App-count:0");
    getByText("Child-count:1");
  });

  fireEvent.click(getByText("change"));
  await waitFor(() => {
    getByText("App-count:1");
  });

  fireEvent.click(getByText("change"));
  await waitFor(() => {
    getByText("App-count:2");
    getByText("Child-count:0");
  });
});
