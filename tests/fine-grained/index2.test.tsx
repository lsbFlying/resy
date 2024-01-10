import React, { memo } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

let fineGrainedCounter = 0;

test("fine-grained-II", async () => {
  const store = createStore({
    count: 0,
    text: "hello world",
    readyOk: false,
  });

  // changes in the state of count data will not cause re-render in Text
  function Text() {
    const { text } = useStore(store);
    fineGrainedCounter++;
    return <p>{text}</p>;
  }

  // changes in the state of text data will not cause re-render in Count
  function Count() {
    const { count } = useStore(store);
    fineGrainedCounter++;
    return <p>{count}</p>;
  }

  // changes in the state of readyOk data will not cause re-render in TextMemo Or CountMemo
  const TextMemo = memo(Text);
  const CountMemo = memo(Count);

  const App = () => {
    const { readyOk } = useStore(store);
    fineGrainedCounter++;
    return (
      <>
        <TextMemo />
        <CountMemo />
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
    expect(fineGrainedCounter === 4).toBeTruthy();
  });

  fireEvent.click(getByText("textChange"));
  await waitFor(() => {
    getByText("good bye");
    expect(fineGrainedCounter === 5).toBeTruthy();
  });

  fireEvent.click(getByText("alreadyChange"));
  await waitFor(() => {
    getByText("ok");
    expect(fineGrainedCounter === 6).toBeTruthy();
  });
});
