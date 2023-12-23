import React, { Component } from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore, MapStateToProps, view } from "../../src";

/** The use mode of view */
test("view-I", async () => {
  type StoreType = {
    count: number;
    text: string;
  };
  const store = createStore<StoreType>({
    count: 0,
    text: "hello world",
  });

  class TestClass extends Component<MapStateToProps<StoreType>> {
    render() {
      const { state: { count, text } } = this.props;
      return (
        <div>
          <p>TestClass:count-{count}</p>
          <p>TestClass:text-{text}</p>
        </div>
      );
    }
  }

  const TestClassView = view(TestClass, {
    stores: store,
  });

  type TestClass2ExtraProps = { mixStr: string };

  class TestClass2 extends Component<MapStateToProps<StoreType> & TestClass2ExtraProps> {
    render() {
      const { state: { count, text }, mixStr } = this.props;
      return (
        <div>
          <p>TestClass2:mixStr-{mixStr}</p>
          <p>TestClass2:count-{count}</p>
          <p>TestClass2:text-{text}</p>
        </div>
      );
    }
  }

  const TestClass2View = view<StoreType, TestClass2ExtraProps>(TestClass2, {
    stores: store,
  });

  const App = () => {
    const { count, text } = useStore(store);
    return (
      <>
        <p>App:count-{count}</p>
        <p>App:text-{text}</p>
        <TestClassView />
        <TestClass2View mixStr={`${count}-${text}`} />
        <button onClick={() => {
          store.setState({
            count: store.count + 1,
            text: "ok",
          });
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
    getByText("TestClass2:count-1");
    getByText("TestClass2:text-ok");
    getByText("TestClass2:mixStr-1-ok");
  });
});
