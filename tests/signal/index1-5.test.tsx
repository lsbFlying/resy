import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, signalsComputed, useSignalsComputed, signalsEffect } from "../../src";

/** Normal operation of signal mode */
test("signal-I-5", async () => {

  const store = createSignals({
    count: 0,
  });

  let renderCounter = 0;

  const App = () => {
    renderCounter++;
    const { count } = store.signals;

    // @ts-ignore
    expect(() => signalsComputed(0)).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(1)).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed("")).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed("999")).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(NaN)).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(undefined)).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(Symbol("not object"))).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(true)).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(false)).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(new Map())).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(new Set())).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(new WeakMap())).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(new WeakSet())).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed([])).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(new WeakRef({}))).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(new RegExp())).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(new Date())).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(BigInt("827348436586436"))).toThrowError();
    // @ts-ignore
    expect(() => signalsComputed(window)).toThrowError();

    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(0)).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(1)).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed("")).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed("999")).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(NaN)).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(undefined)).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(Symbol("not object"))).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(true)).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(false)).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(new Map())).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(new Set())).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(new WeakMap())).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(new WeakSet())).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed([])).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(new WeakRef({}))).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(new RegExp())).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(new Date())).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(BigInt("827348436586436"))).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useSignalsComputed(window)).toThrowError();

    // @ts-ignore
    expect(() => signalsEffect(0)).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(1)).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect("")).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect("999")).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(NaN)).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(undefined)).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(Symbol("not object"))).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(true)).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(false)).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(new Map())).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(new Set())).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(new WeakMap())).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(new WeakSet())).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect([])).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(new WeakRef({}))).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(new RegExp())).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(new Date())).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(BigInt("827348436586436"))).toThrowError();
    // @ts-ignore
    expect(() => signalsEffect(window)).toThrowError();

    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, 0)).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, 1)).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, "")).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, "999")).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, NaN)).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, Symbol("not object"))).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, () => {})).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, new Map())).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, new Set())).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, new WeakMap())).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, new WeakSet())).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, [])).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, new WeakRef({}))).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, new RegExp())).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, new Date())).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, BigInt("827348436586436"))).toThrowError();
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    expect(() => signalsEffect(() => {}, window)).toThrowError();

    return (
      <>
        <p>count:{count}</p>
        <button
          onClick={() => {
            store.count++;
          }}
        >
          add
        </button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    expect(renderCounter === 1).toBeTruthy();
    getByText("count:1");
  });
});
