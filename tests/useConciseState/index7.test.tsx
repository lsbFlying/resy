import React, { useState } from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ConciseStoreHeart, useConciseState, useStore } from "../../src";

/** Advantages of useConciseState */
test("useConciseState-store", async () => {
  type State = {
    count: number;
    text: string;
  };

  function ChildOne(props: ConciseStoreHeart<State>) {
    const { store } = props;
    const { count, text } = useStore(store);

    return (
      <>
        <p>ChildOne-count:{count}</p>
        <p>ChildOne-text:{text}</p>
        <button
          onClick={() => {
            store.setState({
              count: 999,
              text: "ChildOneSetStateNewText",
            });
          }}
        >
          childOneBtn
        </button>
      </>
    );
  }

  function ChildTwo(props: ConciseStoreHeart<State>) {
    const { store } = props;
    const [data, setData] = useState({ count: 0, text: "hello" });

    store.useSubscription(({ nextState }) => {
      setData(nextState);
    });

    return (
      <>
        <p>ChildTwo-count:{data.count}</p>
        <p>ChildTwo-text:{data.text}</p>
      </>
    );
  }

  const App = () => {
    const { count, text, store } = useConciseState<State>({
      count: 0,
      text: "hello",
    });

    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <ChildOne store={store} />
        <ChildTwo store={store} />
        <button onClick={() => {
          store.setState({
            count: 1,
            text: "world",
          });
        }}>change</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("change"));
  await waitFor(() => {
    getByText("1");
    getByText("world");
    getByText("ChildOne-count:1");
    getByText("ChildOne-text:world");
    getByText("ChildTwo-count:1");
    getByText("ChildTwo-text:world");
  });

  fireEvent.click(getByText("childOneBtn"));
  await waitFor(() => {
    getByText("999");
    getByText("ChildOneSetStateNewText");
    getByText("ChildOne-count:999");
    getByText("ChildOne-text:ChildOneSetStateNewText");
    getByText("ChildTwo-count:999");
    getByText("ChildTwo-text:ChildOneSetStateNewText");
  });
});
