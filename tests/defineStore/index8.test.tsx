import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { defineStore } from "../../src";

/**
 * @description `actions` are plain functions, not state slots.
 *
 * They are the way state is *documented and changed* — synchronous setters or
 * async workflows — and they update through `this.x = ...`. They are deliberately
 * not addressable state: the old `enableMarcoActionStateful` option used to make
 * a function property update-and-render like state, and it was removed together
 * with that behaviour. No option is needed for `this`-based updates.
 */
test("defineStore-actions-update-state-through-this", async () => {
  type CounterStore = {
    count: number;
    increaseOrReduce(): void;
  };

  const useCounterStore = defineStore<CounterStore>({
    count: 0,
    // `this.count++` is the intended update path and needs no configuration.
    increaseOrReduce() {
      this.count++;
    },
  });

  type TextStore = {
    text: string;
    changeWorld(): void;
  };

  const useTextStore = defineStore<TextStore>({
    text: "hello world",
    changeWorld() {
      this.text = "change the world";
    },
  });

  const App = () => {
    // You can freely use data from different stores in the components to achieve data sharing effects
    const { count, store: counterStore, increaseOrReduce } = useCounterStore();
    const { text, store: textStore, changeWorld } = useTextStore();

    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <button
          onClick={() => {
            // Try adding three times in a row
            counterStore.count++;
            counterStore.count++;
            counterStore.count++;
          }}
        >
          add
        </button>
        <button
          onClick={() => {
            textStore.text = "The world has changed";
          }}
        >
          textChange
        </button>
        <button
          onClick={increaseOrReduce}
        >
          increaseOrReduce
        </button>
        <button
          onClick={changeWorld}
        >
          changeWorld
        </button>
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

  fireEvent.click(getByText("increaseOrReduce"));
  await waitFor(() => {
    getByText("4");
  });

  fireEvent.click(getByText("changeWorld"));
  await waitFor(() => {
    getByText("change the world");
  });
});

test("defineStore-actions-are-not-addressable-state", async () => {
  /**
   * The counterpart of the contract above: assigning a new function onto an
   * action property must not become a state update. Before the option was
   * removed this needed `enableMarcoActionStateful: false`; now it is simply the
   * only behaviour.
   */
  type Model = { text: string; changeWorld(): void };

  const useStore = defineStore<Model>({
    text: "hello world",
    changeWorld() {
      this.text = "change the world";
    },
  });

  const App = () => {
    const { text, store, changeWorld } = useStore();
    return (
      <>
        <p>{text}</p>
        <button
          onClick={() => {
            store.changeWorld = () => {
              store.text = "no effect, invalid update!";
            };
          }}
        >
          replaceAction
        </button>
        <button onClick={changeWorld}>changeWorld</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("replaceAction"));
  fireEvent.click(getByText("changeWorld"));

  await waitFor(() => {
    getByText("change the world");
    expect(() => getByText("no effect, invalid update!")).toThrowError();
  });
});
