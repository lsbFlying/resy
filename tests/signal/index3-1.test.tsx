import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, useSignalsEffect } from "../../src";

/**
 * @description Test scenarios for useSignalsEffect
 * no signal-type data use, only run once.
 */
test("signal-III-1", async () => {

  const store = createSignals({
    count: 0,
    text: "hello",
  });

  let renderCounter = 0;
  let effectNoSignalCounter = 0;
  let effectSignalSelfNoCalcCounter = 0;
  const App = () => {
    renderCounter++;
    const { count, text } = store.signals;

    useSignalsEffect(() => {
      console.log("useSignalsEffect");
      effectNoSignalCounter++;
    });

    useSignalsEffect(() => {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const countTemp = count;
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const textTemp = text;
      console.log("effectSignalSelfNoCalc");
      /**
       * TODO Important notes are included in the comments below.
       * @description The signal itself is a stable reference,
       * so there will be no side effects of changes here.
       * However, this behavior is inconsistent with the actual runtime result.
       * If we directly log "console.log("effectSignalSelfNoCalc", count, text);" in the code,
       * the test result shows that the side effect is executed twice.
       * It's currently unclear what operations the Vitest testing environment performs to cause this.
       * It's possible that some internal mechanism accesses certain properties
       * of the signal (such as "value") leading to this behavior.
       */
      // console.log("useSignalsEffect", count, text);
      effectSignalSelfNoCalcCounter++;
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
          text-world
        </button>
        <button
          onClick={() => {
            store.text = "ok";
          }}
        >
          text-ok
        </button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    expect(renderCounter === 1).toBeTruthy();
    expect(effectNoSignalCounter === 1).toBeTruthy();
    console.log("effectSignalSelfNoCalcCounter:", effectSignalSelfNoCalcCounter);
    expect(effectSignalSelfNoCalcCounter === 1).toBeTruthy();
    getByText("count:1");
    getByText("text:hello");
  });
  fireEvent.click(getByText("add"));
  await waitFor(() => {
    expect(renderCounter === 1).toBeTruthy();
    expect(effectNoSignalCounter === 1).toBeTruthy();
    expect(effectSignalSelfNoCalcCounter === 1).toBeTruthy();
    getByText("count:2");
    getByText("text:hello");
  });

  fireEvent.click(getByText("text-world"));
  await waitFor(() => {
    expect(renderCounter === 1).toBeTruthy();
    expect(effectNoSignalCounter === 1).toBeTruthy();
    expect(effectSignalSelfNoCalcCounter === 1).toBeTruthy();
    getByText("count:2");
    getByText("text:world");
  });
  fireEvent.click(getByText("text-ok"));
  await waitFor(() => {
    expect(renderCounter === 1).toBeTruthy();
    expect(effectNoSignalCounter === 1).toBeTruthy();
    expect(effectSignalSelfNoCalcCounter === 1).toBeTruthy();
    getByText("count:2");
    getByText("text:ok");
  });
});
