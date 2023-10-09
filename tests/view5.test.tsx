import React, { useState } from "react";
import { test } from "vitest";
import { createStore, MapStateToProps, useStore, view } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

test("view4", async () => {

  type State = { count: number; now: Date };
  const store = createStore<State>(() => ({
    count: 0,
    now: new Date(),
  }));

  const store2 = createStore<State>(() => ({
    count: 0,
    now: new Date(),
  }));

  const store3 = createStore<State>(() => ({
    count: 0,
    now: new Date(),
  }));

  class TestApp extends React.Component<MapStateToProps<State>> {

    render() {
      const { state: { count, now } } = this.props;
      // console.log(now);
      return (
        <div>
          <p>TestApp-count：{count}</p>
          <p>TestApp-now：{now.getMilliseconds()}</p>
          <button onClick={() => {
            store.count++;
          }}>TestApp-btn</button>
        </div>
      );
    }
  }

  const TestAppView = view(TestApp, {
    stores: store,
  });

  function TestApp2(props: MapStateToProps<State>) {
    const { state: { count, now } } = props;
    // console.log(now);
    return (
      <div>
        <p>TestApp2-count：{count}</p>
        <p>TestApp2-now：{now.getMilliseconds()}</p>
        <button onClick={() => {
          store2.count++;
        }}>TestApp2-btn</button>
      </div>
    );
  }

  const TestApp2View = view(TestApp2, {
    stores: store2,
  });

  function TestApp3() {
    const { count, now } = useStore(store3);
    // console.log(now);
    return (
      <div>
        <p>TestApp3-count：{count}</p>
        <p>TestApp3-now：{now.getMilliseconds()}</p>
        <button onClick={() => {
          store3.count++;
        }}>TestApp3-btn</button>
      </div>
    );
  }

  const TestApp3View = view(TestApp3, {
    stores: store3,
  });

  function App() {
    const [show, setShow] = useState(true);
    const [show2, setShow2] = useState(true);
    const [show3, setShow3] = useState(true);
    return (
      <div className="App">
        <div>
          App
          <button onClick={() => {
            setShow(!show);
          }}>AppBtn</button>
          <button onClick={() => {
            setShow2(!show2);
          }}>App2Btn</button>
          <button onClick={() => {
            setShow3(!show3);
          }}>App3Btn</button>
        </div>
        {show ? <TestAppView /> : <p>TestAppViewDisplayNone</p>}
        {show2 ? <TestApp2View /> : <p>TestApp2ViewDisplayNone</p>}
        {show3 ? <TestApp3View /> : <p>TestApp3ViewDisplayNone</p>}
      </div>
    );
  }

  const { getByText } = render(<App />);

  fireEvent.click(getByText("TestApp-btn"));
  await waitFor(() => {
    console.log(1, Date.parse(store.now.toJSON()));
    getByText("TestApp-count：1");
  });

  fireEvent.click(getByText("AppBtn"));
  await waitFor(() => {
    getByText("TestAppViewDisplayNone");
  });

  fireEvent.click(getByText("AppBtn"));
  await waitFor(() => {
    console.log(2, Date.parse(store.now.toJSON()));
    getByText("TestApp-count：0");
  });

  fireEvent.click(getByText("TestApp2-btn"));
  await waitFor(() => {
    console.log(3, Date.parse(store2.now.toJSON()));
    getByText("TestApp2-count：1");
  });

  fireEvent.click(getByText("App2Btn"));
  await waitFor(() => {
    getByText("TestApp2ViewDisplayNone");
  });

  fireEvent.click(getByText("App2Btn"));
  await waitFor(() => {
    console.log(4, Date.parse(store2.now.toJSON()));
    getByText("TestApp2-count：0");
  });

  fireEvent.click(getByText("TestApp3-btn"));
  await waitFor(() => {
    console.log(5, Date.parse(store3.now.toJSON()));
    getByText("TestApp3-count：1");
  });

  fireEvent.click(getByText("App3Btn"));
  await waitFor(() => {
    getByText("TestApp3ViewDisplayNone");
  });

  fireEvent.click(getByText("App3Btn"));
  await waitFor(() => {
    console.log(6, Date.parse(store3.now.toJSON()));
    getByText("TestApp3-count：0");
  });
});
