import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, ComponentWithStore } from "../../src";

/** Unconventional incorrect usage methods of signal mode */
test("signal-I-7", async () => {

  const store = createSignals({
    count: 0,
    text: "hello",
  });

  let renderCounter = 0;

  class App extends ComponentWithStore {
    // @ts-ignore
    store = this.connectStore(store);
    render() {
      renderCounter++;
      // @ts-ignore
      const { count, text } = this.store.signals;

      return (
        <>
          <p>count:{count}</p>
          <p>text:{text}</p>
          <button
            onClick={() => {
              store.count++;
            }}
          >
            countChange
          </button>
          <button
            onClick={() => {
              store.text = "world";
            }}
          >
            textChange
          </button>
        </>
      );
    }
  }

  const { getByText } = render(<App />);

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    expect(renderCounter === 1).toBeTruthy();
    getByText("count:1");
    getByText("text:hello");
  });

  fireEvent.click(getByText("textChange"));
  await waitFor(() => {
    expect(renderCounter === 1).toBeTruthy();
    getByText("count:1");
    getByText("text:world");
  });
});
