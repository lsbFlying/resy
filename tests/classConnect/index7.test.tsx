import React, { useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ComponentWithStore, createStore } from "../../src";

/** Test the optimization function of ComponentWithStore */
test("classConnect-VIII", async () => {
  type Store = {
    count: number;
  };
  type TestProps = {
    text: string;
  };

  const store = createStore<Store>({
    count: 0,
  });

  let testCounter = 0;

  class Test extends ComponentWithStore<TestProps> {

    store = this.connectStore(store);

    render() {
      const { count } = this.store;
      const { text } = this.props;
      testCounter++;
      return (
        <>
          <p>Test-count:{count}</p>
          <p>Test-text:{text}</p>
          <button
            onClick={() => {
              store.count++;
            }}
          >
            Test-add
          </button>
        </>
      );
    }
  }

  function App() {
    const [text, setText] = useState("hello");
    const [okBoolean, setOkBoolean] = useState(false);
    return (
      <>
        <Test text={text} />
        <div>okBoolean:{okBoolean ? "ok" : "none"}</div>
        <button
          onClick={() => {
            setText("world");
          }}
        >
          text-change
        </button>
        <button
          onClick={() => {
            setOkBoolean(prevState => !prevState);
          }}
        >
          ok-b-change
        </button>
      </>
    );
  }

  const { getByText } = render(<App />);

  fireEvent.click(getByText("Test-add"));
  await waitFor(() => {
    getByText("Test-count:1");
    getByText("Test-text:hello");
    getByText("okBoolean:none");
    expect(testCounter === 2).toBeTruthy();
  });

  fireEvent.click(getByText("text-change"));
  await waitFor(() => {
    getByText("Test-count:1");
    getByText("Test-text:world");
    getByText("okBoolean:none");
    expect(testCounter === 3).toBeTruthy();
  });

  fireEvent.click(getByText("ok-b-change"));
  await waitFor(() => {
    getByText("Test-count:1");
    getByText("Test-text:world");
    getByText("okBoolean:ok");
    expect(testCounter === 3).toBeTruthy();
  });
});
