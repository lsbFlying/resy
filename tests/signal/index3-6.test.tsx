import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, useSignalsEffect } from "../../src";

/**
 * @description Test scenarios for useSignalsEffect
 * Test the ability of useSignalsEffect's dependency to automatically track signal-type data.
 * Complex scenarios such as conditional statements, etc.
 */
test("signal-III-6", async () => {

  const store = createSignals({
    count: 0,
    text: "hello",
  });

  let renderCounter1 = 0;
  let effectSignalCounter1 = 0;
  let effectSignalCounter2 = 0;
  let effectSignalCounter3 = 0;

  /** Conditional statement scenarios for complex mixed use scenarios */
  const App = () => {
    renderCounter1++;
    const { count, text } = store.signals;

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", count.value);
      effectSignalCounter1++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect => text:", text.value);
      effectSignalCounter2++;
    });

    /**
     * @description Dependency tracking relies on function execution.
     * If the execution logic misses a dependency for a certain block of code,
     * it will lead to a missing effect execution.
     * However, this does not impact the final execution logic of the effect code,
     * as it still follows the logic defined within the effect's callback function,
     * remaining logically sound and accurate.
     */
    useSignalsEffect(() => {
      if (count.value <= 1) {
        console.log("useSignalsEffect => count");
      } else {
        console.log("useSignalsEffect => text:", text.value);
      }
      effectSignalCounter3++;
    });

    return (
      <>
        <p>count:{count}</p>
        <p>text:{text}</p>
        <button
          onClick={() => {
            store.count++;
          }}
        >
          add
        </button>
        <button
          onClick={() => {
            store.text = "world";
          }}
        >
          text-change1
        </button>
        <button
          onClick={() => {
            store.text = "ok";
          }}
        >
          text-change2
        </button>
        <button
          onClick={() => {
            store.count++;
            store.text = "fun";
          }}
        >
          count-text
        </button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 2).toBeTruthy();
    expect(effectSignalCounter2 === 1).toBeTruthy();
    expect(effectSignalCounter3 === 2).toBeTruthy();
    getByText("count:1");
    getByText("text:hello");
  });
  fireEvent.click(getByText("add"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 3).toBeTruthy();
    expect(effectSignalCounter2 === 1).toBeTruthy();
    expect(effectSignalCounter3 === 3).toBeTruthy();
    getByText("count:2");
    getByText("text:hello");
  });

  fireEvent.click(getByText("text-change1"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 3).toBeTruthy();
    expect(effectSignalCounter2 === 2).toBeTruthy();
    expect(effectSignalCounter3 === 4).toBeTruthy();
    getByText("count:2");
    getByText("text:world");
  });
  fireEvent.click(getByText("text-change2"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 3).toBeTruthy();
    expect(effectSignalCounter2 === 3).toBeTruthy();
    expect(effectSignalCounter3 === 5).toBeTruthy();
    getByText("count:2");
    getByText("text:ok");
  });

  fireEvent.click(getByText("count-text"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 4).toBeTruthy();
    expect(effectSignalCounter2 === 4).toBeTruthy();
    expect(effectSignalCounter3 === 6).toBeTruthy();
    getByText("count:3");
    getByText("text:fun");
  });
});
