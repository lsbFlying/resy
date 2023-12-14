import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** General use of createStore */
test("createStoreNormal", async () => {
  type CounterStore = {
    count: number;
  };

  const counterStore = createStore<CounterStore>({
    count: 0,
  });

  type TextStore = {
    text: string;
  };

  const textStore = createStore<TextStore>({
    text: "hello world",
  });

  const App = () => {
    // You can freely use data from different stores in the components to achieve data sharing effects
    const { count } = useStore(counterStore);
    const { text } = useStore(textStore);

    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <button onClick={() => {
          // Try adding three times in a row
          counterStore.count++;
          counterStore.count++;
          counterStore.count++;
        }}>add</button>
        <button onClick={() => {
          textStore.text = "The world has changed";
        }}>textChange</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    getByText("3");
  });

  fireEvent.click(getByText("textChange"));
  await waitFor(() => {
    getByText("The world has changed");
  });
});
