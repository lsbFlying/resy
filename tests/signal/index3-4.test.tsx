import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, useSignalsEffect } from "../../src";

/**
 * @description Test scenarios for useSignalsEffect
 * Test the ability of useSignalsEffect's dependency to automatically track signal-type data
 */
test("signal-III-4", async () => {

  const store = createSignals({
    count: 0,
    text: "hello",
  });

  let renderCounter1 = 0;
  let effectSignalCounter1 = 0;
  let effectSignalCounter2 = 0;
  let effectSignalCounter3 = 0;
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
     * Mixed use scenario
     * @description The test aims to evaluate the capability of useSignalEffect
     * to accurately track signal-type data changes in complex scenarios and trigger side effects accordingly.
     */
    useSignalsEffect(() => {
      console.log("useSignalsEffect", count.value, text.value);
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
