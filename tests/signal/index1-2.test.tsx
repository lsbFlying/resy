import React, { Component } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, Destructor, signalsComputed, signalsEffect } from "../../src";

/** Normal operation of signal mode */
test("signal-I-2", async () => {

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

  class App extends Component<any, any> {

    signalEffectDestructor = new Set<Destructor>();

    componentDidMount() {
      const { count, text } = store.signals;

      this.signalEffectDestructor.add(signalsEffect(() => {
        console.log("useSignalsEffect: no signal-type data use, only run once.");
        effectNoSignalCounter++;
      }));

      this.signalEffectDestructor.add(signalsEffect(() => {
        console.log(count.value);
        effectCounter++;
      }));

      this.signalEffectDestructor.add(signalsEffect(() => {
        console.log(text.value);
        effectTextNumber++;
      }));
    }

    componentWillUnmount() {
      this.signalEffectDestructor.forEach(destructor => {
        destructor();
      });
    }

    render() {
      renderCounter++;
      const { count, doubleCount, text } = store.signals;

      return (
        <>
          <p>count:{count}</p>
          <p>doubleCount:{doubleCount()}</p>
          <p>text:{text}</p>
          <p>signalsComputed-count:{signalsComputed(() => count * 2)}</p>
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
    }
  }

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
    getByText("text:world");
  });
});
