import React, { useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ComponentWithStore, PureComponentWithStore, createStore } from "../../src";

/** Test the optimization function of PureWidgetWithStore */
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

  let test1Counter = 0;
  let test2Counter = 0;

  class Test1 extends PureComponentWithStore<TestProps> {

    store = this.connectStore(store);

    render() {
      const { count } = this.store;
      const { text } = this.props;
      test1Counter++;
      return (
        <>
          <p>Test1-count:{count}</p>
          <p>Test1-text:{text}</p>
          <button
            onClick={() => {
              store.count++;
            }}
          >
            Test1-add
          </button>
        </>
      );
    }
  }

  class Test2 extends ComponentWithStore<TestProps> {

    store = this.connectStore(store);

    render() {
      const { count } = this.store;
      const { text } = this.props;
      test2Counter++;
      return (
        <>
          <p>Test2-count:{count}</p>
          <p>Test2-text:{text}</p>
          <button
            onClick={() => {
              store.count++;
            }}
          >
            Test2-add
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
        <Test1 text={text} />
        <Test2 text={text} />
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

  fireEvent.click(getByText("Test1-add"));
  await waitFor(() => {
    getByText("Test1-count:1");
    getByText("Test1-text:hello");
    getByText("Test2-count:1");
    getByText("Test2-text:hello");
    getByText("okBoolean:none");
    expect(test1Counter === 2).toBeTruthy();
    expect(test2Counter === 2).toBeTruthy();
  });

  fireEvent.click(getByText("Test2-add"));
  await waitFor(() => {
    getByText("Test1-count:2");
    getByText("Test1-text:hello");
    getByText("Test2-count:2");
    getByText("Test2-text:hello");
    getByText("okBoolean:none");
    expect(test1Counter === 3).toBeTruthy();
    expect(test2Counter === 3).toBeTruthy();
  });

  fireEvent.click(getByText("text-change"));
  await waitFor(() => {
    getByText("Test1-count:2");
    getByText("Test1-text:world");
    getByText("Test2-count:2");
    getByText("Test2-text:world");
    getByText("okBoolean:none");
    expect(test1Counter === 4).toBeTruthy();
    expect(test2Counter === 4).toBeTruthy();
  });

  fireEvent.click(getByText("ok-b-change"));
  await waitFor(() => {
    getByText("Test1-count:2");
    getByText("Test1-text:world");
    getByText("Test2-count:2");
    getByText("Test2-text:world");
    getByText("okBoolean:ok");
    expect(test1Counter === 4).toBeTruthy();
    expect(test2Counter === 5).toBeTruthy();
  });
});
