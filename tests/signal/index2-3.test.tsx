import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { useSignals, SignalStoreHeart } from "../../src";

/**
 * Normal operation of signal mode. Simple use of test useSignals.
 * Test the use of the store transparent transmission function of useSignals.
 */
test("signal-II-3", async () => {

  type Model = {
    count: number;
  };

  const Child = (props: SignalStoreHeart<Model>) => {
    const { store } = props;
    const { count } = store.signals;
    return (
      <div>
        child-count:{count}
      </div>
    );
  };

  let renderCounter = 0;

  const App = () => {
    renderCounter++;

    const {
      count, store,
    } = useSignals<Model>({ count: 0 });

    return (
      <>
        <p>app-count:{count}</p>
        <Child store={store} />
        <button
          onClick={() => {
            store.count++;
          }}
        >
          countChange
        </button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    getByText("app-count:1");
    getByText("child-count:1");
  });

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    console.log("renderCounter:", renderCounter);
    expect(renderCounter === 1).toBeTruthy();
    getByText("app-count:2");
    getByText("child-count:2");
  });
});
