import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/**
 * Components at the same level use different data attributes
 * to render without affecting each other
 */
test("fine-grained-I", async () => {
  let fineGrainedCounterNormal = 0;

  const store = createStore({
    count: 0,
    text: "hello world",
    readyOk: false,
  });

  // changes in the state of count data will not cause re-render in Text
  function Text() {
    const { text } = useStore(store);
    fineGrainedCounterNormal++;
    return <p>{text}</p>;
  }

  // changes in the state of text data will not cause re-render in Count
  function Count() {
    const { count } = useStore(store);
    fineGrainedCounterNormal++;
    return <p>{count}</p>;
  }

  const App = () => {
    const { readyOk } = useStore(store);
    fineGrainedCounterNormal++;
    return (
      <>
        <Count />
        <Text />
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
    expect(fineGrainedCounterNormal === 4).toBeTruthy();
  });

  fireEvent.click(getByText("textChange"));
  await waitFor(() => {
    getByText("good bye");
    expect(fineGrainedCounterNormal === 5).toBeTruthy();
  });

  fireEvent.click(getByText("alreadyChange"));
  await waitFor(() => {
    getByText("ok");
    expect(fineGrainedCounterNormal === 8).toBeTruthy();
  });
});
