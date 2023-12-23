import React, { Component } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore, MapStateToProps, view } from "../../src";

/** The use mode of view */
test("view-IV", async () => {
  type StoreType = {
    count: number;
    text: string;
    count2: number;
    text2: string;
  };
  const store = createStore<StoreType>({
    count: 0,
    text: "hello world",
    count2: 9,
    text2: "code",
  });
  let counter = 0;
  let counter2 = 0;
  let counter3 = 0;

  class TestClass extends Component<MapStateToProps<StoreType>> {
    render() {
      // Automatically collect dependency data, and after enabling memoEnable,
      // only more dependent data will be rendered.
      const { state: { count } } = this.props;
      counter2++;
      return (
        <p>
          TestClass:count-{count > 0 ? this.props.state.count2 : count}
        </p>
      );
    }
  }

  const TestClassView = view(TestClass, {
    stores: store,
    compare: true,
  });

  class TestClass2 extends Component<MapStateToProps<StoreType>> {
    render() {
      const { state: { text } } = this.props;
      counter3++;
      return (
        <p>
          TestClass2:text-{text === "ok" ? this.props.state.text2 : text}
        </p>
      );
    }
  }

  const TestClass2View = view(TestClass2, {
    stores: store,
    compare: true,
  });

  const App = () => {
    const { count, text } = useStore(store);
    counter++;
    return (
      <>
        <p>App:count-{count}</p>
        <p>App:text-{text}</p>
        <TestClassView />
        <TestClass2View />
        <button onClick={() => {
          store.count++;
        }}>countChange</button>
        <button onClick={() => {
          store.text = "ok";
        }}>textChange</button>
        <button onClick={() => {
          store.count2++;
        }}>count2Change</button>
        <button onClick={() => {
          store.text2 = "code ok";
        }}>text2Change</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    getByText("App:count-1");
    getByText("TestClass:count-9");
    console.log("countChange", counter, counter2, counter3);
    expect(counter === 2).toBeTruthy();
    expect(counter2 === 2).toBeTruthy();
    expect(counter3 === 1).toBeTruthy();
  });

  fireEvent.click(getByText("textChange"));
  await waitFor(() => {
    getByText("App:count-1");
    getByText("App:text-ok");
    getByText("TestClass:count-9");
    getByText("TestClass2:text-code");
    console.log("textChange", counter, counter2, counter3);
    expect(counter === 3).toBeTruthy();
    expect(counter2 === 2).toBeTruthy();
    expect(counter3 === 2).toBeTruthy();
  });

  fireEvent.click(getByText("count2Change"));
  await waitFor(() => {
    getByText("App:count-1");
    getByText("TestClass:count-10");
    console.log("count2Change", counter, counter2, counter3);
    expect(counter === 3).toBeTruthy();
    expect(counter2 === 3).toBeTruthy();
    expect(counter3 === 2).toBeTruthy();
  });

  fireEvent.click(getByText("text2Change"));
  await waitFor(() => {
    getByText("App:count-1");
    getByText("App:text-ok");
    getByText("TestClass:count-10");
    getByText("TestClass2:text-code ok");
    console.log("text2Change", counter, counter2, counter3);
    expect(counter === 3).toBeTruthy();
    expect(counter2 === 3).toBeTruthy();
    expect(counter3 === 3).toBeTruthy();
  });
});
