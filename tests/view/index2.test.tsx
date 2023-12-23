import React, { Component } from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore, MapStateToProps, view } from "../../src";

/** The use mode of view */
test("view-II", async () => {
  type CounterStoreType = {
    count: number;
  };
  type TextStoreType = {
    text: string;
  };
  const counterStore = createStore<CounterStoreType>({
    count: 0,
  });
  const textStore = createStore<TextStoreType>({
    text: "hello world",
  });

  type TestClassPropsState = {
    counterStore: CounterStoreType;
    textStore: TextStoreType;
  };

  class TestClass extends Component<MapStateToProps<TestClassPropsState>> {
    render() {
      const {
        state: {
          counterStore: { count },
          textStore: { text }
        }
      } = this.props;
      return (
        <div>
          <p>TestClass:count-{count}</p>
          <p>TestClass:text-{text}</p>
        </div>
      );
    }
  }

  const TestClassView = view<TestClassPropsState>(TestClass, {
    stores: {
      counterStore: counterStore,
      textStore: textStore,
    },
  });

  const App = () => {
    const { count } = useStore(counterStore);
    const { text } = useStore(textStore);
    return (
      <>
        <p>App:count-{count}</p>
        <p>App:text-{text}</p>
        <TestClassView />
        <button onClick={() => {
          counterStore.count++;
          textStore.text = "ok";
        }}>change</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("change"));
  await waitFor(() => {
    getByText("App:count-1");
    getByText("App:text-ok");
    getByText("TestClass:count-1");
    getByText("TestClass:text-ok");
  });
});
