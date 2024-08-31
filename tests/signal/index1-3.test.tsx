import React, { Component } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals } from "../../src";

/** Normal operation of signal mode. Testing the use of actions */
test("signal-I-3", async () => {

  const store = createSignals({
    count: 0,
    increase() {
      this.count++;
    },
  });

  let classRenderCounter = 0;
  let hookRenderCounter = 0;

  class AppClass extends Component<any, any> {
    render() {
      classRenderCounter++;

      const {
        count, increase,
      } = store.signals;

      return (
        <>
          <p>count-class:{count}</p>
          <button onClick={store.increase}>
            increase-class
          </button>
          <button onClick={increase}>
            increase2-class
          </button>
        </>
      );
    }
  }

  const AppHook = () => {
    hookRenderCounter++;

    const {
      count, increase,
    } = store.signals;

    return (
      <>
        <p>count-hook:{count}</p>
        <button onClick={store.increase}>
          increase-hook
        </button>
        <button onClick={increase}>
          increase2-hook
        </button>
      </>
    );
  };

  const { getByText } = render(
    <>
      <AppClass />
      <AppHook />
    </>
  );

  fireEvent.click(getByText("increase-class"));
  await waitFor(() => {
    expect(classRenderCounter === 1).toBeTruthy();
    getByText("count-class:1");
  });

  fireEvent.click(getByText("increase2-class"));
  await waitFor(() => {
    expect(classRenderCounter === 1).toBeTruthy();
    getByText("count-class:2");
  });

  fireEvent.click(getByText("increase-hook"));
  await waitFor(() => {
    expect(hookRenderCounter === 1).toBeTruthy();
    getByText("count-hook:3");
  });

  fireEvent.click(getByText("increase2-hook"));
  await waitFor(() => {
    expect(hookRenderCounter === 1).toBeTruthy();
    getByText("count-hook:4");
  });
});
