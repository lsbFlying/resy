import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore, view } from "../../src";

let fineGrainedCounterView = 0;
/** "View" can avoid unnecessary rendering of parent-child components */
test("fine-grained.view", async () => {
  const store = createStore({
    count: 0,
    text: "hello world",
    readyOk: false,
  });

  // changes in the state of count data will not cause re-render in Text
  function Text() {
    const { text } = useStore(store);
    fineGrainedCounterView++;
    return <p>{text}</p>;
  }

  // changes in the state of text data will not cause re-render in Count
  function Count() {
    const { count } = useStore(store);
    fineGrainedCounterView++;
    return <p>{count}</p>;
  }

  // changes in the state of readyOk data will not cause re-render in TextView Or CountView
  const TextView = view(Text);
  const CountView = view(Count);

  const App = () => {
    const { readyOk } = useStore(store);
    fineGrainedCounterView++;
    return (
      <>
        <TextView />
        <CountView />
        <p>{readyOk ? "ok" : "loading"}</p>
        <button onClick={() => {
          store.count++;
        }}>countChange</button>
        <button onClick={() => {
          store.text = "good bye";
        }}>textChange</button>
        <button onClick={() => {
          store.readyOk = true;
        }}>alreadyChange</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    getByText("1");
    expect(fineGrainedCounterView === 4).toBeTruthy();
  });

  fireEvent.click(getByText("textChange"));
  await waitFor(() => {
    getByText("good bye");
    expect(fineGrainedCounterView === 5).toBeTruthy();
  });

  fireEvent.click(getByText("alreadyChange"));
  await waitFor(() => {
    getByText("ok");
    expect(fineGrainedCounterView === 6).toBeTruthy();
  });
});
