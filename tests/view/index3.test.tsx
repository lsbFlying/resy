import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore, MapStateToProps, view } from "../../src";

/** The use mode of view */
test("view-III", async () => {
  type StoreType = {
    count: number;
    text: string;
  };
  const store = createStore<StoreType>({
    count: 0,
    text: "hello world",
  });

  function TestHook(props: MapStateToProps<StoreType>) {
    const { state: { count, text } } = props;
    return (
      <div>
        <p>TestClass:count-{count}</p>
        <p>TestClass:text-{text}</p>
      </div>
    );
  }

  const TestHookView = view(TestHook, {
    stores: store,
  });

  type TestClass2ExtraProps = { mixStr: string };

  function TestHook2(props: MapStateToProps<StoreType> & TestClass2ExtraProps) {
    const { state: { count, text }, mixStr } = props;
    return (
      <div>
        <p>TestClass2:mixStr-{mixStr}</p>
        <p>TestClass2:count-{count}</p>
        <p>TestClass2:text-{text}</p>
      </div>
    );
  }

  const TestHook2View = view<StoreType, TestClass2ExtraProps>(TestHook2, {
    stores: store,
  });

  const App = () => {
    const { count, text } = useStore(store);
    return (
      <>
        <p>App:count-{count}</p>
        <p>App:text-{text}</p>
        <TestHookView />
        <TestHook2View mixStr={`${count}-${text}`} />
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
