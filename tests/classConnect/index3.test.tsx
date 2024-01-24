import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ComponentWithStore, createStore } from "../../src";

/** Mixed use of class components */
test("classConnect-III", async () => {
  type CounterStoreType = {
    count: number;
  };

  const counterStore = createStore<CounterStoreType>({
    count: 0,
  });

  type TextStoreType = {
    text: string;
  };

  const textStore = createStore<TextStoreType>({
    text: "hello world",
  });

  class App extends ComponentWithStore {

    counterStore = this.connectStore(counterStore);

    textStore = this.connectStore(textStore);

    render() {
      const { count } = this.counterStore;
      const { text } = this.textStore;
      return (
        <>
          <p>{count}</p>
          <p>{text}</p>
          <button onClick={() => {
            counterStore.count++;
          }}>counter</button>
          <button onClick={() => {
            textStore.text = "ok";
          }}>text</button>
          <button onClick={() => {
            counterStore.setState({
              count: 9,
            });
          }}>counterSetState</button>
          <button onClick={() => {
            textStore.setState({
              text: "fine",
            });
          }}>textSetState</button>
        </>
      );
    }
  }

  const { getByText } = render(<App />);

  fireEvent.click(getByText("counter"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("text"));
  await waitFor(() => {
    getByText("ok");
  });

  fireEvent.click(getByText("counterSetState"));
  await waitFor(() => {
    getByText("9");
  });

  fireEvent.click(getByText("textSetState"));
  await waitFor(() => {
    getByText("fine");
  });
});
