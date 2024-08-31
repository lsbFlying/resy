import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, signalsComputed, useSignalsComputed, useSignalsEffect } from "../../src";

/** Normal operation of signal mode */
test("signal-I-1", async () => {

  const store = createSignals({
    count: 0,
    // Functions in signal mode have the ability to update rendering
    doubleCount() {
      return this.count * 2;
    },
    text: "hello",
  });

  let effectNoSignalCounter = 0;

  let effectCounter = 0;

  let renderCounter = 0;

  let effectTextNumber = 0;

  const App = () => {
    renderCounter++;
    const { count, doubleCount, text } = store.signals;

    useSignalsEffect(() => {
      console.log("useSignalsEffect: no signal-type data use, only run once.");
      effectNoSignalCounter++;
    });

    useSignalsEffect(() => {
      console.log(count.value);
      effectCounter++;
    });

    useSignalsEffect(() => {
      console.log(text.value);
      effectTextNumber++;
    });

    return (
      <>
        <p>count:{count}</p>
        <p>doubleCount:{doubleCount()}</p>
        <p>text:{text}</p>
        <p>signalsComputed-count:{signalsComputed(() => count * 2)}</p>
        <p>useSignalsComputed-count:{useSignalsComputed(() => count * 2)}</p>
        <button
          onClick={() => {
            store.count++;
          }}
        >
          add
        </button>
        <button
          onClick={() => {
            store.count--;
          }}
        >
          subtract
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
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    console.log("effectCounter:", effectCounter, "renderCounter:", renderCounter);
    expect(effectNoSignalCounter === 1).toBeTruthy();
    expect(effectCounter === 2).toBeTruthy();
    expect(renderCounter === 1).toBeTruthy();
    expect(effectTextNumber === 1).toBeTruthy();
    getByText("count:1");
    getByText("doubleCount:2");
    getByText("signalsComputed-count:2");
    getByText("useSignalsComputed-count:2");
    getByText("text:hello");
  });

  fireEvent.click(getByText("subtract"));
  await waitFor(() => {
    console.log("effectCounter:", effectCounter, "renderCounter:", renderCounter);
    expect(effectNoSignalCounter === 1).toBeTruthy();
    expect(effectCounter === 3).toBeTruthy();
    expect(renderCounter === 1).toBeTruthy();
    expect(effectTextNumber === 1).toBeTruthy();
    getByText("count:0");
    getByText("doubleCount:0");
    getByText("signalsComputed-count:0");
    getByText("useSignalsComputed-count:0");
    getByText("text:hello");
  });

  fireEvent.click(getByText("textChange"));
  await waitFor(() => {
    console.log("effectCounter:", effectCounter, "renderCounter:", renderCounter);
    expect(effectNoSignalCounter === 1).toBeTruthy();
    expect(effectCounter === 3).toBeTruthy();
    expect(renderCounter === 1).toBeTruthy();
    expect(effectTextNumber === 2).toBeTruthy();
    getByText("count:0");
    getByText("doubleCount:0");
    getByText("signalsComputed-count:0");
    getByText("useSignalsComputed-count:0");
    getByText("text:world");
  });
});
