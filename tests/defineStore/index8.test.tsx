import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { defineStore } from "../../src";

/** The configuration item of `defineStore` named `enableMarcoActionStateful` */
test("defineStore-enableMarcoActionStateful", async () => {
  type CounterStore = {
    count: number;
    increaseOrReduce(): void;
  };

  const useCounterStore = defineStore<CounterStore>({
    count: 0,
    /**
     * The enableMarcoActionStateful is configured to be true,
     * so that the action here has the ability to update the rendering
     */
    increaseOrReduce() {
      this.count++;
    },
  }, { enableMarcoActionStateful: true });

  type TextStore = {
    text: string;
    changeWorld(): void;
  };

  const useTextStore = defineStore<TextStore>({
    text: "hello world",
    /**
     * If enableMarcoActionStateful is not configured to be true,
     * then the action will only process events as an action and will not have the ability to update the rendering.
     */
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
          onClick={() => {
            counterStore.increaseOrReduce = () => {
              counterStore.count--;
            };
          }}
        >
          actionPropUpdateEffect
        </button>
        <button
          onClick={changeWorld}
        >
          changeWorld
        </button>
        <button
          onClick={() => {
            textStore.changeWorld = () => {
              textStore.text = "no effect, invalid update!";
            };
          }}
        >
          actionPropUpdateNoEffect
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

  fireEvent.click(getByText("actionPropUpdateEffect"));
  fireEvent.click(getByText("increaseOrReduce"));
  await waitFor(() => {
    getByText("5");
    expect(() => getByText("3")).toThrowError();
  });

  fireEvent.click(getByText("changeWorld"));
  await waitFor(() => {
    getByText("change the world");
  });

  fireEvent.click(getByText("actionPropUpdateNoEffect"));
  fireEvent.click(getByText("changeWorld"));
  await waitFor(() => {
    getByText("change the world");
    expect(() => getByText("no effect, invalid update!")).toThrowError();
  });
});
