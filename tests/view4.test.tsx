import React, { useState } from "react";
import { test } from "vitest";
import { createStore, MapStateToProps, view, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

test("view4", async () => {

  type State = { count: number };
  const store = createStore<State>({
    count: 0,
  });

  const store2 = createStore<State>({
    count: 0,
  });

  const store3 = createStore<State>({
    count: 0,
  });

  class TestApp extends React.Component<MapStateToProps<State>> {

    render() {
      const { state: { count } } = this.props;
      return (
        <div>
          <p>TestApp-count：{count}</p>
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
    const { state: { count } } = props;
    return (
      <div>
        <p>TestApp2-count：{count}</p>
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
    const { count } = useStore(store3);
    return (
      <div>
        <p>TestApp3-count：{count}</p>
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
    getByText("TestApp-count：1");
  });

  fireEvent.click(getByText("AppBtn"));
  await waitFor(() => {
    getByText("TestAppViewDisplayNone");
  });

  fireEvent.click(getByText("AppBtn"));
  await waitFor(() => {
    getByText("TestApp-count：0");
  });

  fireEvent.click(getByText("TestApp2-btn"));
  await waitFor(() => {
    getByText("TestApp2-count：1");
  });

  fireEvent.click(getByText("App2Btn"));
  await waitFor(() => {
    getByText("TestApp2ViewDisplayNone");
  });

  fireEvent.click(getByText("App2Btn"));
  await waitFor(() => {
    getByText("TestApp2-count：0");
  });

  fireEvent.click(getByText("TestApp3-btn"));
  await waitFor(() => {
    getByText("TestApp3-count：1");
  });

  fireEvent.click(getByText("App3Btn"));
  await waitFor(() => {
    getByText("TestApp3ViewDisplayNone");
  });

  fireEvent.click(getByText("App3Btn"));
  await waitFor(() => {
    getByText("TestApp3-count：0");
  });
});
