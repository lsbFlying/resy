import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/**
 * The use of function properties
 * @description Test the scenario in which the function property is called directly
 */
test("functionProp-I", async () => {
  type Store = {
    count: number;
    doubleCount(): number;
    word: string;
    statement(): string;
  };

  const store = createStore<Store>({
    count: 0,
    doubleCount() {
      return this.count * 2;
    },
    word: "",
    statement() {
      return `${this.word}_world!`;
    }
  });

  const Count = () => {
    const { count, doubleCount } = useStore(store);

    return (
      <>
        <p>count:{count}</p>
        <p>doubleCount:{doubleCount()}</p>
        <button onClick={() => {
          store.count++;
        }}>countAdd</button>
      </>
    );
  };

  const Text = () => {
    const { word } = useStore(store);
    // The 'statement' involves only a reference to the 'word' data, so here,
    // the 'statement' can be correctly rendered even if it is not fetched from useStore
    const { statement } = store;

    return (
      <>
        <p>word:{word}</p>
        <p>statement:{statement()}</p>
        <button onClick={() => {
          store.word = "hello";
        }}>textChange</button>
      </>
    );
  };

  const App = () => (
    <>
      <Count />
      <Text />
    </>
  );

  const { getByText } = render(<App />);

  fireEvent.click(getByText("countAdd"));
  await waitFor(() => {
    getByText("count:1");
    getByText("doubleCount:2");
  });

  fireEvent.click(getByText("textChange"));
  await waitFor(() => {
    getByText("word:hello");
    getByText("statement:hello_world!");
  });
});
