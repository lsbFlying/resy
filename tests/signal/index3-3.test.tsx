import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, useSignalsEffect } from "../../src";

/**
 * @description Test scenarios for useSignalsEffect
 * When referencing signal type data and utilizing properties or methods
 * such as `value`, `truthy`, `falsy`, `toJSON`, or `typeOf`,
 * corresponding effects will be executed based on the specific signal being used.
 */
test("signal-III-3", async () => {

  const store = createSignals({
    count: 0,
    text: "hello",
  });

  let renderCounter1 = 0;
  let effectSignalValueCounter1 = 0;
  let effectSignalTruthyCounter1 = 0;
  let effectSignalFalsyCounter1 = 0;
  let effectSignalToJSONCounter1 = 0;
  let effectSignalTypeOfCounter1 = 0;

  let effectSignalValueCounter2 = 0;
  let effectSignalTruthyCounter2 = 0;
  let effectSignalFalsyCounter2 = 0;
  let effectSignalToJSONCounter2 = 0;
  let effectSignalTypeOfCounter2 = 0;

  /**
   * @description The test aims to evaluate the capability of useSignalEffect
   * to accurately track signal-type data changes in complex scenarios and trigger side effects accordingly.
   */
  const App = () => {
    renderCounter1++;
    const { count, text } = store.signals;

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", count.value);
      effectSignalValueCounter1++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", count.truthy);
      effectSignalTruthyCounter1++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", count.falsy);
      effectSignalFalsyCounter1++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", count.toJSON());
      effectSignalToJSONCounter1++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", count.typeOf());
      effectSignalTypeOfCounter1++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", text.value);
      effectSignalValueCounter2++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", text.truthy);
      effectSignalTruthyCounter2++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", text.falsy);
      effectSignalFalsyCounter2++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", text.toJSON());
      effectSignalToJSONCounter2++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", text.typeOf());
      effectSignalTypeOfCounter2++;
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
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalValueCounter1 === 2).toBeTruthy();
    expect(effectSignalTruthyCounter1 === 2).toBeTruthy();
    expect(effectSignalFalsyCounter1 === 2).toBeTruthy();
    expect(effectSignalToJSONCounter1 === 2).toBeTruthy();
    expect(effectSignalTypeOfCounter1 === 2).toBeTruthy();
    getByText("count:1");
    getByText("text:hello");
    expect(effectSignalValueCounter2 === 1).toBeTruthy();
    expect(effectSignalTruthyCounter2 === 1).toBeTruthy();
    expect(effectSignalFalsyCounter2 === 1).toBeTruthy();
    expect(effectSignalToJSONCounter2 === 1).toBeTruthy();
    expect(effectSignalTypeOfCounter2 === 1).toBeTruthy();
  });
  fireEvent.click(getByText("add"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalValueCounter1 === 3).toBeTruthy();
    expect(effectSignalTruthyCounter1 === 3).toBeTruthy();
    expect(effectSignalFalsyCounter1 === 3).toBeTruthy();
    expect(effectSignalToJSONCounter1 === 3).toBeTruthy();
    expect(effectSignalTypeOfCounter1 === 3).toBeTruthy();
    getByText("count:2");
    getByText("text:hello");
    expect(effectSignalValueCounter2 === 1).toBeTruthy();
    expect(effectSignalTruthyCounter2 === 1).toBeTruthy();
    expect(effectSignalFalsyCounter2 === 1).toBeTruthy();
    expect(effectSignalToJSONCounter2 === 1).toBeTruthy();
    expect(effectSignalTypeOfCounter2 === 1).toBeTruthy();
  });

  fireEvent.click(getByText("text-world"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalValueCounter1 === 3).toBeTruthy();
    expect(effectSignalTruthyCounter1 === 3).toBeTruthy();
    expect(effectSignalFalsyCounter1 === 3).toBeTruthy();
    expect(effectSignalToJSONCounter1 === 3).toBeTruthy();
    expect(effectSignalTypeOfCounter1 === 3).toBeTruthy();
    expect(effectSignalValueCounter2 === 2).toBeTruthy();
    expect(effectSignalTruthyCounter2 === 2).toBeTruthy();
    expect(effectSignalFalsyCounter2 === 2).toBeTruthy();
    expect(effectSignalToJSONCounter2 === 2).toBeTruthy();
    expect(effectSignalTypeOfCounter2 === 2).toBeTruthy();
    getByText("count:2");
    getByText("text:world");
  });
  fireEvent.click(getByText("text-ok"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalValueCounter1 === 3).toBeTruthy();
    expect(effectSignalTruthyCounter1 === 3).toBeTruthy();
    expect(effectSignalFalsyCounter1 === 3).toBeTruthy();
    expect(effectSignalToJSONCounter1 === 3).toBeTruthy();
    expect(effectSignalTypeOfCounter1 === 3).toBeTruthy();
    expect(effectSignalValueCounter2 === 3).toBeTruthy();
    expect(effectSignalTruthyCounter2 === 3).toBeTruthy();
    expect(effectSignalFalsyCounter2 === 3).toBeTruthy();
    expect(effectSignalToJSONCounter2 === 3).toBeTruthy();
    expect(effectSignalTypeOfCounter2 === 3).toBeTruthy();
    getByText("count:2");
    getByText("text:ok");
  });
});
