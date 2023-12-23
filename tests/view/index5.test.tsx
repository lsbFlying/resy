import React, { Component } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore, MapStateToProps, view } from "../../src";

/** The use mode of view */
test("view-V", async () => {
  type CounterStoreType = {
    count: number;
    count2: number;
  };
  type TextStoreType = {
    text: string;
    text2: string;
  };
  const counterStore = createStore<CounterStoreType>({
    count: 0,
    count2: 9,
  });
  const textStore = createStore<TextStoreType>({
    text: "hello world",
    text2: "code",
  });
  let counter = 0;
  let counter2 = 0;
  let counter3 = 0;

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
      counter2++;
      return (
        <div>
          <p>TestClass:count-{count > 0 ? this.props.state.counterStore.count2 : count}</p>
          <p>TestClass:text-{text === "ok" ? this.props.state.textStore.text2 : text}</p>
        </div>
      );
    }
  }

  const TestClassView = view<TestClassPropsState>(TestClass, {
    stores: {
      counterStore: counterStore,
      textStore: textStore,
    },
    compare: true,
  });

  class TestClass2 extends Component<MapStateToProps<TestClassPropsState>> {
    render() {
      const {
        state: {
          counterStore: { count2 },
          textStore: { text2 }
        }
      } = this.props;
      counter3++;
      return (
        <div>
          <p>TestClass2:count2-{count2 >= 10 ? this.props.state.counterStore.count : count2}</p>
          <p>TestClass2:text2-{text2 === "code ok" ? this.props.state.textStore.text : text2}</p>
        </div>
      );
    }
  }

  const TestClass2View = view<TestClassPropsState>(TestClass2, {
    stores: {
      counterStore: counterStore,
      textStore: textStore,
    },
    compare: true,
  });

  const App = () => {
    const { count, count2 } = useStore(counterStore);
    const { text, text2 } = useStore(textStore);
    counter++;
    return (
      <>
        <p>App:count-{count}</p>
        <p>App:text-{text}</p>
        <p>App:count2-{count2}</p>
        <p>App:text2-{text2}</p>
        <TestClassView />
        <TestClass2View />
        <button onClick={() => {
          counterStore.count++;
          textStore.text = "ok";
        }}>change1</button>
        <button onClick={() => {
          counterStore.count2++;
          textStore.text2 = "code ok";
        }}>change2</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("change1"));
  await waitFor(() => {
    getByText("App:count-1");
    getByText("App:text-ok");
    getByText("App:count2-9");
    getByText("App:text2-code");
    getByText("TestClass:count-9");
    getByText("TestClass:text-code");
    getByText("TestClass2:count2-9");
    getByText("TestClass2:text2-code");
    console.log("change1", counter, counter2, counter3);
    expect(counter === 2).toBeTruthy();
    expect(counter2 === 2).toBeTruthy();
    expect(counter3 === 1).toBeTruthy();
  });

  fireEvent.click(getByText("change2"));
  await waitFor(() => {
    getByText("App:count-1");
    getByText("App:text-ok");
    getByText("App:count2-10");
    getByText("App:text2-code ok");
    getByText("TestClass:count-10");
    getByText("TestClass:text-code ok");
    getByText("TestClass2:count2-1");
    getByText("TestClass2:text2-ok");
    console.log("change2", counter, counter2, counter3);
    expect(counter === 3).toBeTruthy();
    expect(counter2 === 3).toBeTruthy();
    expect(counter3 === 2).toBeTruthy();
  });
});
