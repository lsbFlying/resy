import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ComponentWithStore, createStore, PureComponentWithStore } from "../../src";

test("fine-grained-IV", async () => {
  let fineGrainedCounter = 0;

  const store = createStore({
    count: 0,
    text: "hello world",
    readyOk: false,
  });

  // changes in the state of count data will not cause re-render in Text
  class Text extends PureComponentWithStore {
    store = this.connectStore(store);
    render() {
      const { text } = this.store;
      fineGrainedCounter++;
      return <p>{text}</p>;
    }
  }

  // changes in the state of text data will not cause re-render in Count
  class Count extends PureComponentWithStore {
    store = this.connectStore(store);
    render() {
      const { count } = this.store;
      fineGrainedCounter++;
      return <p>{count}</p>;
    }
  }

  class App extends ComponentWithStore {
    store = this.connectStore(store);
    render() {
      const { readyOk } = this.store;
      fineGrainedCounter++;
      return (
        <>
          <Text />
          <Count />
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
    }
  }

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
